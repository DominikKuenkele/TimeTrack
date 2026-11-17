import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import ActivityOverview from './components/Activity/ActivityOverview';
import Header from './components/Header';
import ProjectOverview from './components/Project/ProjectOverview';

const App: React.FC = () => {
    return (
        <Router>
            <div className="App">
                <Header />
                <main className="container">
                    <Routes>
                        <Route path="/" element={<ProjectOverview />} />
                        <Route path="/projects" element={<ProjectOverview />} />
                        <Route path="/activities" element={<ActivityOverview />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
