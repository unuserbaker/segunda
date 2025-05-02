import { useState } from 'react';
import useMainApp from '@/shared/Hooks/useMainApp';
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { setColorsMui } from '@/utils/functions';

const RowDetalles = ({
  dataRow,
  indexRow,
  headersTable,
  enableTooltip = false,
  textTolltip = '',
  detailHeadersTable,
  detailDataKey,
  actionButtons,
}) => {
  const { colors } = useMainApp();
  const [open, setOpen] = useState(false);
  const handlers = {
    onClick: () => {
      setOpen(!open);
    },
  };

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          cursor: 'pointer',
          background: open ? colors?.HxPrimary : 'unset',
        }}
      >
        {headersTable.map((header) => (
          <Tooltip
            key={`tooltip-${header.key}-${indexRow}`}
            followCursor
            title={
              open
                ? 'click para cerrar vista'
                : enableTooltip
                  ? textTolltip
                  : ''
            }
            sx={{ m: 0, p: 0 }}
          >
            <TableCell
              {...handlers}
              key={`cell-${header.key}-${indexRow}`}
              align="center"
            >
              {dataRow[header.key]}
            </TableCell>
          </Tooltip>
        ))}
        {!!actionButtons?.buttons?.length && (
          <TableCell align="center" style={{ paddingBottom: 0, paddingTop: 0 }}>
            {actionButtons?.buttons.map(
              (
                {
                  name,
                  titButton = null,
                  handleClick,
                  icon: Icon,
                  color = 'success',
                },
                index
              ) => (
                <Tooltip
                  key={`tooltActBut-${indexRow + index}`}
                  placement="left-start"
                  title={titButton ?? name}
                  arrow
                  sx={{ m: 0, p: 0 }}
                >
                  {!Icon ? (
                    <Button
                      sx={{ p: 1, background: color }}
                      type="button"
                      variant="contained"
                      color={setColorsMui(color)}
                      onClick={() => handleClick(indexRow)}
                    >
                      {name}
                    </Button>
                  ) : (
                    <IconButton
                      sx={{ color: color }}
                      color={color}
                      onClick={() => handleClick(indexRow)}
                    >
                      {<Icon />}
                    </IconButton>
                  )}
                </Tooltip>
              )
            )}
          </TableCell>
        )}
      </TableRow>
      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={
            headersTable.length + (actionButtons?.buttons?.length ? 1 : 0)
          }
          align="center"
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Detalles {dataRow['personalName']}
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    {detailHeadersTable.map((header, index) => (
                      <TableCell
                        key={`detailHeadersTable-${index + indexRow}`}
                        sx={{
                          padding: '0 5px',
                          backgroundColor: 'gray',
                          p: 0,
                        }}
                        align="center"
                      >
                        {header.name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataRow[detailDataKey]?.map((detalle, index) => (
                    <TableRow key={`dataRow-dDky-${indexRow}-${index}`}>
                      {detailHeadersTable.map((header, i) => (
                        <TableCell
                          align="center"
                          key={`detail-${header.key}-${indexRow}-${i}`}
                          sx={{
                            fontFamily: 'cursive',
                            fontSize: '0.8rem',
                          }}
                          scope="row"
                        >
                          {detalle[header.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};
export default RowDetalles;
