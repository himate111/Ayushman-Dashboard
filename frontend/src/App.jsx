import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import theme from './theme';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';

// Pages (Beneficiary Grievance)
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import InsightsExplorer from './pages/InsightsExplorer';
import UploadReport from './pages/UploadReport';
import UploadHistory from './pages/UploadHistory';
import GrievanceExplorer from './pages/GrievanceExplorer';
import DataQuality from './pages/DataQuality';
import SettingsPage from './pages/SettingsPage';

// Lazy-load Inbound module for optimal code splitting & bundle size
const InboundExecutiveDashboard = lazy(() => import('./modules/inbound/pages/InboundExecutiveDashboard'));
const InboundInsightsExplorer = lazy(() => import('./modules/inbound/pages/InboundInsightsExplorer'));
const InboundUploadReport = lazy(() => import('./modules/inbound/pages/InboundUploadReport'));
const InboundUploadHistory = lazy(() => import('./modules/inbound/pages/InboundUploadHistory'));
const InboundCallRecordsExplorer = lazy(() => import('./modules/inbound/pages/InboundCallRecordsExplorer'));
const InboundDataQualityAudit = lazy(() => import('./modules/inbound/pages/InboundDataQualityAudit'));

export default function App() {
  // Parse initial module & tab from URL with backward-compatibility
  const parseUrlRoute = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const moduleParam = params.get('module');
      const tab = params.get('tab');

      // Backward-compatible Phase 2 preview: ?tab=inbound
      if (tab === 'inbound') {
        return { module: 'inbound', tab: 'dashboard' };
      }

      const validModules = ['grievance', 'inbound'];
      const module = validModules.includes(moduleParam) ? moduleParam : 'grievance';
      const validGrievanceTabs = ['dashboard', 'insights', 'upload', 'history', 'explorer', 'quality', 'settings'];
      const validInboundTabs = ['dashboard', 'insights', 'upload', 'history', 'explorer', 'quality', 'settings'];
      const validTabs = module === 'inbound' ? validInboundTabs : validGrievanceTabs;

      return {
        module,
        tab: validTabs.includes(tab) ? tab : 'dashboard'
      };
    } catch {}
    return { module: 'grievance', tab: 'dashboard' };
  };

  const [route, setRoute] = useState(parseUrlRoute);
  const activeModule = route.module;
  const activeTab = route.tab;

  const [targetChart, setTargetChart] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('chart') || null;
    } catch {
      return null;
    }
  });

  const [explorerFilters, setExplorerFilters] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Global filters shared between Dashboard & Insights Explorer (Beneficiary Grievance)
  const [globalFilters, setGlobalFilters] = useState({
    district: 'All',
    districts: [],
    category: 'All',
    categories: [],
    status: 'All',
    statuses: [],
    officer: 'All',
    officers: [],
    priority: 'All',
    riskOnly: false,
    startDate: null,
    endDate: null,
  });

  // Global filters shared between Dashboard & Insights Explorer (Inbound Call Analytics)
  const [inboundFilters, setInboundFilters] = useState({
    year: [],
    month: [],
    startDate: '',
    endDate: '',
    groupName: [],
    agent: [],
    disposition: [],
    subDisposition: [],
    shift: []
  });

  const handleInboundFilterChange = (key, value) => {
    setInboundFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleInboundResetFilters = () => {
    setInboundFilters({
      year: [],
      month: [],
      startDate: '',
      endDate: '',
      groupName: [],
      agent: [],
      disposition: [],
      subDisposition: [],
      shift: []
    });
  };

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : { username: 'admin', fullName: 'National Administrator', role: 'Administrator' };
    } catch {
      return { username: 'admin', fullName: 'National Administrator', role: 'Administrator' };
    }
  });

  // Sync state with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const next = parseUrlRoute();
      setRoute(next);
      try {
        const params = new URLSearchParams(window.location.search);
        setTargetChart(params.get('chart') || null);
      } catch {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateUrl = (module, tab, chart = null) => {
    try {
      const url = new URL(window.location.href);
      if (module === 'grievance') {
        url.searchParams.delete('module');
      } else {
        url.searchParams.set('module', module);
      }
      url.searchParams.set('tab', tab);
      if (chart) {
        url.searchParams.set('chart', chart);
      } else {
        url.searchParams.delete('chart');
      }
      window.history.pushState(null, '', url.toString());
    } catch {}
  };

  const handleSelectModule = (newModule) => {
    if (newModule === activeModule) return;
    setRoute({ module: newModule, tab: 'dashboard' });
    setTargetChart(null);
    updateUrl(newModule, 'dashboard', null);
  };

  const handleSelectTab = (tab) => {
    setRoute((prev) => ({ ...prev, tab }));
    setTargetChart(null);
    updateUrl(activeModule, tab, null);
    if (tab !== 'explorer') {
      setExplorerFilters(null);
    }
  };

  const handleNavigateToInsights = (chartKey) => {
    setRoute({ module: 'grievance', tab: 'insights' });
    setTargetChart(chartKey);
    updateUrl('grievance', 'insights', chartKey);
  };

  const handleNavigateToChart = (chartKey) => {
    setRoute({ module: 'grievance', tab: 'dashboard' });
    setTargetChart(chartKey);
    updateUrl('grievance', 'dashboard', chartKey);
  };

  const handleNavigateToInboundInsights = (sectionKey) => {
    setRoute({ module: 'inbound', tab: 'insights' });
    setTargetChart(sectionKey);
    updateUrl('inbound', 'insights', sectionKey);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoginOpen(true);
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setIsLoginOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleNavigateToExplorer = (filters) => {
    setExplorerFilters(filters);
    setRoute({ module: 'grievance', tab: 'explorer' });
    updateUrl('grievance', 'explorer', null);
  };

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleFilterChange = (key, value) => {
    setGlobalFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'districts') {
        next.district = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'district') {
        if (value === 'All') {
          next.districts = [];
        } else if (typeof value === 'string') {
          next.districts = [value];
        }
      } else if (key === 'categories') {
        next.category = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'category') {
        if (value === 'All') {
          next.categories = [];
        } else if (typeof value === 'string') {
          next.categories = [value];
        }
      } else if (key === 'statuses') {
        next.status = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'status') {
        if (value === 'All') {
          next.statuses = [];
        } else if (typeof value === 'string') {
          next.statuses = [value];
        }
      } else if (key === 'officers') {
        next.officer = Array.isArray(value) && value.length === 1 
          ? value[0] 
          : (Array.isArray(value) && value.length === 0 ? 'All' : value.join(', '));
      } else if (key === 'officer') {
        if (value === 'All') {
          next.officers = [];
        } else if (typeof value === 'string') {
          next.officers = [value];
        }
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setGlobalFilters({
      district: 'All',
      districts: [],
      category: 'All',
      categories: [],
      status: 'All',
      statuses: [],
      officer: 'All',
      officers: [],
      priority: 'All',
      riskOnly: false,
      startDate: null,
      endDate: null,
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          width: '100%',
          maxWidth: '100vw',
          minHeight: '100vh', 
          height: '100vh', 
          bgcolor: '#F8FAFC', 
          overflow: 'hidden' 
        }}
      >
        <Sidebar
          activeModule={activeModule}
          onSelectModule={handleSelectModule}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          user={user}
          onLogout={handleLogout}
        />

        <Box 
          component="main"
          sx={{ 
            flexGrow: 1, 
            minWidth: 0, 
            maxWidth: { xs: '100vw', sm: 'calc(100vw - 210px)' },
            width: { xs: '100%', sm: 'calc(100% - 210px)' },
            height: { xs: 'calc(100vh - 90px)', sm: '100vh' }, 
            overflowY: 'auto', 
            overflowX: 'hidden', 
            bgcolor: '#F8FAFC',
            boxSizing: 'border-box',
          }}
        >
          {activeModule === 'grievance' && activeTab === 'dashboard' && (
            <ExecutiveDashboard
              key={refreshKey}
              onNavigateToExplorer={handleNavigateToExplorer}
              onNavigateToInsights={handleNavigateToInsights}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              targetChart={targetChart}
              filters={globalFilters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
          )}

          {activeModule === 'grievance' && activeTab === 'insights' && (
            <InsightsExplorer
              key={refreshKey}
              targetChart={targetChart}
              onNavigateToChart={handleNavigateToChart}
              filters={globalFilters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
          )}

          {activeModule === 'grievance' && activeTab === 'upload' && (
            <UploadReport onUploadSuccess={handleUploadSuccess} />
          )}

          {activeModule === 'grievance' && activeTab === 'history' && (
            <UploadHistory key={refreshKey} />
          )}

          {activeModule === 'grievance' && activeTab === 'explorer' && (
            <GrievanceExplorer initialFilters={explorerFilters} />
          )}

          {activeModule === 'grievance' && activeTab === 'quality' && (
            <DataQuality key={refreshKey} onNavigateToExplorer={handleNavigateToExplorer} />
          )}

          {activeTab === 'settings' && (
            <SettingsPage currentUser={user || { username: 'admin', role: 'Admin' }} />
          )}

          {activeModule === 'inbound' && activeTab === 'dashboard' && (
            <Suspense fallback={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <CircularProgress size={36} sx={{ color: '#235789' }} />
              </Box>
            }>
              <InboundExecutiveDashboard
                key={`inbound-dash-${refreshKey}`}
                onNavigateToInsights={handleNavigateToInboundInsights}
                targetChart={targetChart}
                filters={inboundFilters}
                onFilterChange={handleInboundFilterChange}
                onResetFilters={handleInboundResetFilters}
              />
            </Suspense>
          )}

          {activeModule === 'inbound' && activeTab === 'insights' && (
            <Suspense fallback={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <CircularProgress size={36} sx={{ color: '#235789' }} />
              </Box>
            }>
              <InboundInsightsExplorer
                key={`inbound-ins-${refreshKey}`}
                targetSection={targetChart}
                targetChart={targetChart}
                onNavigateToDashboard={() => handleSelectTab('dashboard')}
                onNavigateToChart={(chartKey) => {
                  setRoute({ module: 'inbound', tab: 'dashboard' });
                  setTargetChart(chartKey);
                  updateUrl('inbound', 'dashboard', chartKey);
                }}
                filters={inboundFilters}
                onFilterChange={handleInboundFilterChange}
                onResetFilters={handleInboundResetFilters}
              />
            </Suspense>
          )}

          {activeModule === 'inbound' && activeTab === 'upload' && (
            <Suspense fallback={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <CircularProgress size={36} sx={{ color: '#235789' }} />
              </Box>
            }>
              <InboundUploadReport onUploadSuccess={handleUploadSuccess} />
            </Suspense>
          )}

          {activeModule === 'inbound' && activeTab === 'history' && (
            <Suspense fallback={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <CircularProgress size={36} sx={{ color: '#235789' }} />
              </Box>
            }>
              <InboundUploadHistory key={`inbound-hist-${refreshKey}`} />
            </Suspense>
          )}

          {activeModule === 'inbound' && activeTab === 'explorer' && (
            <Suspense fallback={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <CircularProgress size={36} sx={{ color: '#235789' }} />
              </Box>
            }>
              <InboundCallRecordsExplorer key={`inbound-exp-${refreshKey}`} initialFilters={explorerFilters} />
            </Suspense>
          )}

          {activeModule === 'inbound' && activeTab === 'quality' && (
            <Suspense fallback={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <CircularProgress size={36} sx={{ color: '#235789' }} />
              </Box>
            }>
              <InboundDataQualityAudit key={`inbound-qual-${refreshKey}`} />
            </Suspense>
          )}
        </Box>
      </Box>

      <LoginModal
        open={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </ThemeProvider>
  );
}
