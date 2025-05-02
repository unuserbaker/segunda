import { useState } from 'react';
import { TextField, Button, CircularProgress } from '@mui/material';

const CustomFile = ({ extensionsAllowed, onChange, ...props }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const fileList = event.target.files;
    setSelectedFiles(Array.from(fileList));
    setLoading(true); // Activar el estado de carga al seleccionar archivos
    onChange(fileList);
    setLoading(false); // Desactivar el estado de carga después de cambiar los archivos
  };

  return (
    <div>
      <TextField
        accept={extensionsAllowed.join(',')}
        style={{ display: 'none' }}
        id="contained-button-file"
        multiple
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="contained-button-file">
        <Button variant="outlined" component="span" sx={{ ...props?.sx }}>
          Seleccionar archivo
        </Button>
      </label>
      <div>
        Archivos seleccionados:
        {selectedFiles.map((file, index) => (
          <div key={index}>{file.name}</div>
        ))}
      </div>
      {loading && <CircularProgress />}{' '}
      {/* Mostrar CircularProgress mientras se seleccionan archivos */}
    </div>
  );
};

export default CustomFile;
