import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Screens
import Home from './screens/home/HomeScreen'
import Child from './screens/child/ChildScreen'
import ControlCenter from './screens/controlCenter/ControlCenterScreen'

export default function Navigation() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/kind" element={<Child />} />
                <Route path="/leitstelle" element={<ControlCenter />} />
                {/* Fallback für alles andere */}
                <Route path="*" element={<Home />} />
            </Routes>
        </Router>
    )
}
