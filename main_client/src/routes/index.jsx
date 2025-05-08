import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';

import adminRoutes from './admin';
import ErrorPage from '@P/Error/index.jsx';
import HomePage from '@P/Home/index.jsx';

import LoginPage, { loader } from '@P/Login/index.jsx';

import LoadingComponent from '@C/Loading/index.jsx';

import LandingLayout from '@/shared/Components/Layouts/landing/index.jsx';

import { ROUTE_IDS } from '@/utils/vars';

const landingRoutes = {
    path: '/',
    element: (
        <LandingLayout
            topBackGround="primary"
            TopTitle={'Segunda'}
        />
    ),
    children: [
        {
            index: true,
            path: '/home',
            element: <HomePage />,
        },
        // {
        //     path: '/inventory',
        //     element: <InventoryPage />,
        // },
        // {
        //     path: '/pricing',
        //     element: <PricingPage />,
        // },
        // {
        //     path: '/blog',
        //     element: <BlogPage />,
        // },
        // {
        //     path: '/dealers',
        //     element: <DealersPage />,
        // },
        {
            id: ROUTE_IDS.LOGIN,
            path: '/login',
            loader: loader,
            element: <LoginPage />,
        },
        {
            path: '/',
            element: <Navigate to="/home" replace />
        },
    ],
};

const routes = createBrowserRouter([
    {
        errorElement: <ErrorPage />,
        children: [
            landingRoutes,
            ...adminRoutes,
        ],
    },
]);

const Routes = () => {
    return <RouterProvider router={routes} fallbackElement={<LoadingComponent />} />;
};

export default Routes;
