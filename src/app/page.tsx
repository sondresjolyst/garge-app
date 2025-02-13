import React from 'react';
import Navigation from '../components/Navigation';

const HomePage: React.FC = () => {
    return (
        <div>
            <Navigation />
            <h1>Welcome to the Home Page</h1>
            <p>This is your main entry point. Use the navigation links above to access the login and register pages.</p>
        </div>
    );
};

export default HomePage;
