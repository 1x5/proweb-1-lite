import { 
  RouterProvider, 
  createBrowserRouter,
  future
} from 'react-router-dom';

// Конфигурация для будущих изменений React Router v7
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <HomePage />,
    },
    {
      path: '/order/:id',
      element: <OrderDetailsPage />,
    }
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App; 