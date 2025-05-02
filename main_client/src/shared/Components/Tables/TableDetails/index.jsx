import { useState } from 'react';
import {
  Button,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import RowDetalles from './RowDetalles';
import { setColorsMui } from '@/utils/functions';

const TableDetails = ({
  data,
  tableHeaders,
  detailHeadersTable,
  detailDataKey,
  inputFilter = false,
  actionButtons = { title: 'Acciones', buttons: [] },
  headerButtons,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filterText, setFilterText] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = data
    ?.map((row, index) => ({ ...row, indexRow: index }))
    .filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(filterText.toLowerCase())
      )
    );

  return (
    <>
      <Grid
        container
        spacing={2}
        justifyContent={'space-between'}
        sx={{ p: 2 }}
      >
        {headerButtons.length && !!filteredData.length && (
          <Grid container spacing={2} sx={{ margin: '5px 0 0 0' }}>
            {headerButtons.map(
              ({ name, handleClick, color = 'success', disabled }, index) =>
                !disabled && (
                  <Grid item key={`HB-${index + Math.random()}`}>
                    <Button
                      sx={{ background: color }}
                      disableFocusRipple
                      disableTouchRipple
                      disabled={disabled}
                      variant="contained"
                      color={setColorsMui(color)}
                      type="button"
                      onClick={(e) => handleClick(e, filteredData)}
                    >
                      {name}
                    </Button>
                  </Grid>
                )
            )}
          </Grid>
        )}
        {inputFilter && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Filtrar"
                variant="outlined"
                size="small"
                color="success"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (filterText) setFilterText('');
                      }}
                    >
                      {filterText ? <FilterAltOffIcon /> : <FilterAltIcon />}
                    </IconButton>
                  ),
                }}
                sx={{ float: 'right' }}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
      <TableContainer component={Paper}>
        <Table
          aria-label="collapsible table"
          size="small"
          sx={{ tableLayout: 'auto' }}
        >
          <TableHead>
            <TableRow>
              {tableHeaders.map(({ name, key }) => (
                <TableCell
                  align={'center'}
                  key={key}
                  sx={{ fontWeight: 'bold' }}
                >
                  {name}
                </TableCell>
              ))}
              {!!actionButtons?.buttons?.length && (
                <TableCell align={'center'} sx={{ fontWeight: 'bold' }}>
                  {actionButtons.title}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? filteredData.slice(
                  page * rowsPerPage,
                  page * rowsPerPage + rowsPerPage
                )
              : filteredData
            ).map((rowData, index) => (
              <RowDetalles
                key={`row-${index}-${rowData.indexRow}`}
                indexRow={rowData.indexRow}
                dataRow={rowData}
                headersTable={tableHeaders}
                enableTooltip={true}
                textTolltip={`click para ver detalles ${rowData['personalName']} ${rowData['numDocumento']}`}
                detailHeadersTable={detailHeadersTable}
                detailDataKey={detailDataKey}
                actionButtons={actionButtons}
              />
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, { label: 'Todo', value: -1 }]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </>
  );
};

export default TableDetails;
