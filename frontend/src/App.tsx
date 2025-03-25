import React from 'react';
import { CookiesProvider } from 'react-cookie';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './components/AuthContext';
import Header from './components/Header';
import Login from './components/Login';
import ProjectOverview from './components/ProjectOverview';

const App: React.FC = () => {
    return (
        <CookiesProvider>
            <AuthProvider>
                <Router>
                    <div className="App">
                        <Header />
                        <main className="container">
                            <Routes>
                                <Route path="/" element={<ProjectOverview />} />
                                <Route path="/login" element={<Login />} />
                            </Routes>
                        </main>
                    </div>
                </Router>
            </AuthProvider>
        </CookiesProvider>
    );
};

export default App; 