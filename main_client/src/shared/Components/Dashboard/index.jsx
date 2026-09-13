const DashBoard = ({ tittle = 'dashboard' }) => {
    return (
        <div>
            {/* TODO: banner de verificación pendiente, depende de GET /sellers/me (ver adr-registro-seller-y-verificacion.md) */}
            <h4>{tittle}</h4>
        </div>
    );
};

export default DashBoard;
