import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  FileBarChart,
  Calendar,
  Menu,
  Bell,
  Settings,
  LogOut,
  TrendUp,
  TrendDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

// Mock stats and orders data
const stats = [
  {
    label: "Revenue",
    value: "$124,580",
    trend: "+12%",
    trendType: "up",
    icon: <BarChart3 className="w-6 h-6 text-primary" />,
    bg: "bg-primary/10",
  },
  {
    label: "Customers",
    value: "2,847",
    trend: "+8%",
    trendType: "up",
    icon: <Users className="w-6 h-6 text-accent" />,
    bg: "bg-accent/10",
  },
  {
    label: "Orders",
    value: "1,249",
    trend: "+23%",
    trendType: "up",
    icon: <ShoppingCart className="w-6 h-6 text-success" />,
    bg: "bg-success/10",
  },
  {
    label: "Products",
    value: "189",
    trend: "+2%",
    trendType: "up",
    icon: <Package className="w-6 h-6 text-info" />,
    bg: "bg-info/10",
  }
];

const sampleOrders = [
  {
    id: "ORD-1001",
    customer: "Alice Johnson",
    amount: "$1,200.00",
    status: "Completed"
  },
  {
    id: "ORD-1002",
    customer: "Bob Smith",
    amount: "$850.50",
    status: "Processing"
  },
  {
    id: "ORD-1003",
    customer: "Carlos Rivera",
    amount: "$340.00",
    status: "Shipped"
  },
  {
    id: "ORD-1004",
    customer: "Diana Lee",
    amount: "$2,420.00",
    status: "Pending"
  }
];

// Sidebar navigation
const navItems = [
  { label: "Dashboard", icon: <BarChart3 />, active: true },
  { label: "Customers", icon: <Users /> },
  { label: "Inventory", icon: <Package /> },
  { label: "Orders", icon: <ShoppingCart /> },
  { label: "Reports", icon: <FileBarChart /> },
  { label: "Schedule", icon: <Calendar /> }
];

// Status badge styles
const statusStyles = {
  "Completed": "bg-success/10 text-success border-success",
  "Processing": "bg-warning/10 text-warning border-warning",
  "Shipped": "bg-info/10 text-info border-info",
  "Pending": "bg-gray-200 text-pending border-pending"
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard({
  isAuthenticated,
  user,
  onLogin,
  onLogout
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary via-blue-500 to-blue-400">
        <div className="bg-white/80 rounded-2xl shadow-card px-10 py-12 flex flex-col items-center w-full max-w-md">
          <span className="flex items-center mb-4">
            <BarChart3 className="w-8 h-8 text-primary" />
            <span className="ml-2 text-2xl font-bold text-primary tracking-tight font-sans">BusinessPro</span>
          </span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign in to your dashboard</h2>
          <p className="text-gray-500 mb-8 text-center">Welcome! Please authenticate with Keycloak to continue.</p>
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors shadow hover:shadow-lg focus:outline-none"
          >
            <span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#3b82f6" />
                <path d="M8 15l4-6 4 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            Sign in with Keycloak
          </button>
          <div className="mt-8 text-xs text-gray-400 text-center">
            &copy; {new Date().getFullYear()} BusinessPro. All rights reserved.
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col shadow-card transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:static md:shadow-none"
        )}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
          <span className="flex items-center gap-2 font-bold text-primary text-lg select-none">
            <BarChart3 className="w-6 h-6" />
            BusinessPro
          </span>
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map(({ label, icon, active }) => (
            <button
              key={label}
              className={classNames(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                active
                  ? "bg-primary text-white shadow"
                  : "text-gray-700 hover:bg-primary/10 hover:text-primary"
              )}
              tabIndex={0}
            >
              {React.cloneElement(icon, { className: "w-5 h-5" })}
              {label}
            </button>
          ))}
        </nav>
        <div className="p-6 mt-auto">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
            tabIndex={0}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      <div
        className={classNames(
          "fixed inset-0 z-20 bg-black bg-opacity-30 transition-opacity duration-300 md:hidden",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      ></div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Header */}
        <header className="flex items-center justify-between h-20 px-4 border-b border-gray-100 bg-white shadow-sm md:px-8">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-2 rounded hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6 text-primary" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">Welcome, {user?.name || "User"}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1 right-1 block h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
            <div className="hidden md:flex flex-col items-end ml-4">
              <span className="text-gray-900 font-medium">{user?.name}</span>
              <span className="text-gray-400 text-xs">{user?.email}</span>
            </div>
            <button
              className="ml-2 md:hidden p-2 rounded hover:bg-gray-100 transition-colors"
              onClick={onLogout}
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </header>

        {/* Main dashboard area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Stats cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={classNames(
                  "rounded-xl shadow-card bg-white p-6 flex flex-col gap-3 transition-transform hover:-translate-y-1 hover:shadow-lg group"
                )}
              >
                <div className={classNames(
                  "inline-flex items-center justify-center rounded-lg mb-2 w-11 h-11",
                  s.bg
                )}>
                  {s.icon}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{s.value}</span>
                  <span className={classNames(
                    "inline-flex items-center ml-2 text-sm font-medium",
                    s.trendType === "up"
                      ? "text-success"
                      : "text-red-500"
                  )}>
                    {s.trendType === "up" ? (
                      <span className="w-4 h-4 mr-1" />
                    ) : (
                      <span className="w-4 h-4 mr-1" />
                    )}
                    {s.trend}
                  </span>
                </div>
                <span className="text-gray-500">{s.label}</span>
              </div>
            ))}
          </section>

          {/* Content grid: Revenue chart + Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Chart Placeholder */}
            <section className="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-card p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Revenue (Last 12 months)</h2>
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs bg-primary/10 text-primary font-semibold">
                  +12% growth
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                {/* Chart placeholder */}
                <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-lg border border-dashed border-gray-300 relative">
                  <span className="text-gray-400 text-sm">
                    {/* Integration point for chart.js, recharts, etc. */}
                    {/* Example: Use <BarChart /> from your preferred library */}
                    <span className="block mb-1">[Chart Placeholder]</span>
                    <span>
                      <span className="font-medium text-primary">To add a chart:</span> Integrate Chart.js, Recharts, or similar here.
                    </span>
                  </span>
                </div>
              </div>
            </section>

            {/* Recent Orders Table */}
            <section className="bg-white rounded-xl shadow-card p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
                <button className="text-primary text-sm font-medium hover:underline">View all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase">
                      <th className="py-2 px-4 font-semibold text-left">Order ID</th>
                      <th className="py-2 px-4 font-semibold text-left">Customer</th>
                      <th className="py-2 px-4 font-semibold text-right">Amount</th>
                      <th className="py-2 px-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleOrders.map((order) => (
                      <tr key={order.id} className="border-b last:border-none">
                        <td className="py-2 px-4 font-mono text-gray-700">{order.id}</td>
                        <td className="py-2 px-4">{order.customer}</td>
                        <td className="py-2 px-4 text-right">{order.amount}</td>
                        <td className="py-2 px-4 text-center">
                          <span className={classNames(
                            "inline-block px-2 py-1 rounded-full border text-xs font-semibold",
                            statusStyles[order.status] || statusStyles["Pending"]
                          )}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}