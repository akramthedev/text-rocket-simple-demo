import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UPLOAD_CSV_PAGE from './Views/UPLOAD_CSV_PAGE';
import "./App.css";



function App() {
  
  return (
    <Router>
      <nav>
        <Link to="/">Upload</Link> | 
      </nav>

      <Routes>
        <Route path="/" element={<UPLOAD_CSV_PAGE />} />
      </Routes>
    </Router>
  );

}

export default App;