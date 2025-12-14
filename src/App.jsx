import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Upload from './Views/Upload';
import "./App.css";



function App() {
  
  return (
    <Router>
      <nav>
        <Link to="/">Upload</Link> | 
      </nav>

      <Routes>
        <Route path="/" element={<Upload />} />
      </Routes>
    </Router>
  );

}

export default App;