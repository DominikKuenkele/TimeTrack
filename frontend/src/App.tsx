import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import ActivityOverview from './components/Activity/ActivityOverview';
import { AuthProvider } from './components/AuthContext';
import Header from './components/Header';
import Login from './components/Login';
import ProjectOverview from './components/Project/ProjectOverview';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Header />
                    <main className="container">
                        <Routes>
                            <Route path="/" element={<ProjectOverview />} />
                            <Route path="/projects" element={<ProjectOverview />} />
                            <Route path="/activities" element={<ActivityOverview />} />
                            <Route path="/login" element={<Login />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
};

export default App; 