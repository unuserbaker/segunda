import { useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Tooltip,
  Typography,
} from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useFormikContext } from 'formik';

// Importa los iconos
import wordIcon from '../../../../public/icons/word-icon.png';
import excelIcon from '../../../../public/icons/excel-icon.png';
import txtIcon from '../../../../public/icons/txt-icon.png';
import genericFileIcon from '../../../../public/icons/generic-file-icon.png';

function FileUpload({ maxFiles = 3, name, disabled }) {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const { setFieldValue } = useFormikContext();

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!isDragOver && !disabled) setIsDragOver(true);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (!disabled) setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(false);
      processFiles(event.dataTransfer.files);
    }
  };

  const handleFileSelect = (event) => {
    if (!disabled) processFiles(event.target.files);
  };

  const processFiles = (fileList) => {
    const newFiles = [];
    let errorFound = false;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        let preview = '';

        if (file.type.startsWith('image/')) preview = URL.createObjectURL(file);
        else if (file.type === 'application/pdf')
          preview = URL.createObjectURL(file);
        else if (file.type === 'text/plain') preview = txtIcon;
        else if (file.type.includes('spreadsheetml')) preview = excelIcon;
        else if (
          file.type.includes('wordprocessingml') ||
          file.type === 'application/msword'
        )
          preview = wordIcon;
        else preview = genericFileIcon;

        newFiles.push(Object.assign(file, { preview }));
        if (newFiles.length === fileList.length && !errorFound)
          endProcess(newFiles);
      };

      reader.onerror = () => {
        errorFound = true;
        setErrorMessage(
          `El archivo ${file.name} está dañado o presenta algún error.`
        );
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const endProcess = (newFiles) => {
    if (files.length + newFiles.length > maxFiles) {
      setErrorMessage(`No puedes subir más de ${maxFiles} archivos.`);
      return;
    }

    setErrorMessage('');
    setFiles((currentFiles) => [...currentFiles, ...newFiles]);
  };

  const removeFile = (fileName) => {
    setFiles((currentFiles) =>
      currentFiles.filter((file) => file.name !== fileName)
    );
    files.forEach(
      (file) => file.name === fileName && URL.revokeObjectURL(file.preview)
    );
  };

  const handleClick = () => {
    if (!disabled) fileInputRef.current.click();
  };

  const dropzoneStyle = {
    border: isDragOver ? '1px dashed blue' : '1px dashed gray',
    padding: '20px',
    textAlign: 'center',
    cursor: disabled ? 'none' : 'pointer',
    transition: 'all 0.3s ease-out',
    boxShadow: isDragOver ? '0 2px 10px #c0c0c0e3' : '',
    transform: isDragOver ? 'scale(1.05)' : 'scale(1)',
  };

  useEffect(() => {
    setFieldValue(name, files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, name]);

  return (
    <Box>
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={dropzoneStyle}
      >
        <Typography>
          Arrastra y suelta los archivos aquí, o haz clic para seleccionarlos
        </Typography>
        <input
          disabled={disabled}
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-upload"
        />
      </div>
      {errorMessage && (
        <Typography color="error" style={{ marginTop: '10px' }}>
          {errorMessage}
        </Typography>
      )}
      <aside>
        <List>
          <ListItem disablePadding sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', padding: 1 }}>
              {files?.map((file) => (
                <ListItemButton
                  key={file.name}
                  sx={{ padding: 2 }}
                  onClick={() => removeFile(file.name)}
                >
                  {file.type.startsWith('image/') && (
                    <img
                      src={file.preview}
                      style={{ width: '100px', height: '60px' }}
                      alt="preview"
                    />
                  )}
                  {file.type === 'application/pdf' && (
                    <object
                      data={file.preview}
                      type="application/pdf"
                      width="100px"
                      height="60px"
                      style={{ overflow: 'hidden' }}
                    ></object>
                  )}
                  {file.type === 'text/plain' && (
                    <img
                      src={file.preview}
                      style={{ width: '100px' }}
                      alt="archivo de texto"
                    />
                  )}
                  {[
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',
                  ].includes(file.type) && (
                    <img
                      src={file.preview}
                      style={{ width: '100px' }}
                      alt="documento word"
                    />
                  )}
                  {[
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                  ].includes(file.type) && (
                    <img
                      src={file.preview}
                      style={{ width: '100px' }}
                      alt="documento excel"
                    />
                  )}
                  {![
                    'image/',
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'text/plain',
                  ].some((type) => file.type.startsWith(type)) && (
                    <img
                      src={file.preview}
                      style={{ width: '100px' }}
                      alt="File icon"
                    />
                  )}
                  <Tooltip title="Remover">
                    <IconButton onClick={() => removeFile(file.name)}>
                      <RemoveCircleOutlineIcon color="error" />
                    </IconButton>
                  </Tooltip>
                </ListItemButton>
              ))}
            </Box>
          </ListItem>
        </List>
      </aside>
    </Box>
  );
}

export default FileUpload;
