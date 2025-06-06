import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import ActivityOverview from './components/Activity/ActivityOverview';
import { Callback } from './components/auth/Callback';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './components/AuthContext';
import Header from './components/Header';
import ProjectOverview from './components/Project/ProjectOverview';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Header />
                    <main className="container">
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <ProjectOverview />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/projects"
                                element={
                                    <ProtectedRoute>
                                        <ProjectOverview />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/activities"
                                element={
                                    <ProtectedRoute>
                                        <ActivityOverview />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/auth/login" element={<Login />} />
                            <Route path="/auth/callback" element={<Callback />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
};

export default App; 