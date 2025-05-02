import { Radio, FormControlLabel } from '@mui/material';
import NovusLogo from '../../../../assets/logo-gruponovus.png'
import GopassLogo from '../../../../assets/logo-gopass.png';

const CustomRadio = ({ idEmpresa, strCode, selectedValue, onChange }) => {
  return (
    <FormControlLabel
      value={idEmpresa}
      control={<Radio />}
      label={
        <img
          src={strCode === 'GOPASS' ? GopassLogo : NovusLogo}
          alt={`${strCode} Logo`}
          style={{ height: 150, width: 150 }}
        />
      }
      checked={selectedValue === idEmpresa}
      onChange={onChange}
    />
  );
};

export default CustomRadio;
