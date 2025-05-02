import { useState } from 'react';
import CustomTextField from '../Inputs/CustomTextfield';
const TextFieldNotasTable = ({ onWrite, ...props }) => {
  const [nota, setNota] = useState('');
  return (
    <CustomTextField
      disabled={false}
      fullWidth={true}
      placeholder="Notas"
      name={'nota'}
      value={nota}
      onChange={(e) => {
        setNota(e.target.value);
        onWrite(e.target.value);
      }}
      {...props}
    />
  );
};
export default TextFieldNotasTable;
