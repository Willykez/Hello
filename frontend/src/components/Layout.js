import React from 'react';
import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="pt-16 md:pt-14 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;