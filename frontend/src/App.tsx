import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import ProjectOverview from './components/ProjectOverview';

const App: React.FC = () => {
    return (
        <Router>
            <div className="App">
                <Header />
                <main className="container">
                    <Routes>
                        <Route path="/" element={<ProjectOverview />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App; 