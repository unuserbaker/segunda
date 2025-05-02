import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

/**
 * El componente RedirectPage se utiliza para redirigir al usuario a una URL especificada
 * utilizando el hook useNavigate de React Router.
 */
function RedirectUtil({ url }) {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(url, { relative: 'path', replace: true });
    }, [navigate, url]);

    return <Outlet />;
}

export default RedirectUtil;

