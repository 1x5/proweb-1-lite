import { 
  RouterProvider, 
  createBrowserRouter
} from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import HomePage from './pages/HomePage';
import OrderDetailsPage from './pages/OrderDetailsPage';

// Конфигурация маршрутов
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/order/:id',
    element: <OrderDetailsPage />,
  }
]);

function App() {
  return (
    <ThemeProvider>
      <div 
        className="hide-safari-bar" 
        style={{ 
          backgroundColor: theme.bg
        }}
      >
        <RouterProvider router={router} />
      </div>
    </ThemeProvider>
  );
}

export default App; 