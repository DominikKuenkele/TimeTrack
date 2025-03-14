import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import ProjectList from './components/ProjectList';

const App: React.FC = () => {
    return (
        <Router>
            <div className="App">
                <Header />
                <main className="container">
                    <Routes>
                        <Route path="/" element={<ProjectList />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App; 