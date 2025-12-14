import { Navigate } from 'react-router-dom';

// Redirect to main auth flow
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
