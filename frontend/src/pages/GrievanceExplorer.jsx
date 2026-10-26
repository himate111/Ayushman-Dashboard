import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  InputAdornment, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Pagination, 
  Chip, 
  CircularProgress,
  IconButton,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Search, Eye, AlertTriangle, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { searchGrievances } from '../api/grievanceApi';
import { getFilterOptions } from '../api/analyticsApi';
import GrievanceDetailModal from '../components/GrievanceDetailModal';

export default function GrievanceExplorer({ initialFilters }) {
  const [query, setQuery] = useState({
    searchTerm: '',
    district: initialFilters?.district || 'All',
    category: initialFilters?.category || 'All',
    status: initialFilters?.status || 'All',
    ageBucket: initialFilters?.ageBucket || 'All',
    riskCategory: initialFilters?.riskCategory || 'All',
    riskOnly: initialFilters?.riskOnly || false,
    officer: initialFilters?.officer || 'All',
    grievanceType: initialFilters?.grievanceType || 'All',
    sortBy: 'CompDate',
    sortDescending: true,
    page: 1,
    pageSize: 20,
  });

  const [data, setData] = useState({ items: [], totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({ districts: [], categories: [], officers: [] });
  const [selectedGrievanceId, setSelectedGrievanceId] = useState(null);

  // Sync when drill-down initialFilters prop changes
  useEffect(() => {
    if (initialFilters) {
      setQuery((prev) => ({
        ...prev,
        district: initialFilters.district || 'All',
        category: initialFilters.category || 'All',
        status: initialFilters.status || 'All',
        ageBucket: initialFilters.ageBucket || 'All',
        riskCategory: initialFilters.riskCategory || 'All',
        riskOnly: initialFilters.riskOnly ?? (initialFilters.riskCategory && initialFilters.riskCategory !== 'All' ? true : false),
        officer: initialFilters.officer || 'All',
        grievanceType: initialFilters.grievanceType || 'All',
        page: 1,
      }));
    }
  }, [initialFilters]);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const res = await searchGrievances(query);
      setData(res);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadOpts = async () => {
      try {
        const opts = await getFilterOptions();
        setFilterOptions(opts);
      } catch (e) {
        console.error('Failed to load filter options:', e);
      }
    };
    loadOpts();
  }, []);

  useEffect(() => {
    fetchGrievances();
  }, [
    query.page,
    query.pageSize,
    query.district,
    query.category,
    query.status,
    query.ageBucket,
    query.riskCategory,
    query.riskOnly,
    query.officer,
    query.grievanceType,
    query.sortBy,
    query.sortDescending,
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setQuery({ ...query, page: 1 });
    fetchGrievances();
  };

  const handleResetFilters = () => {
    setQuery({
      searchTerm: '',
      district: 'All',
      category: 'All',
      status: 'All',
      ageBucket: 'All',
      riskCategory: 'All',
      riskOnly: false,
      officer: 'All',
      grievanceType: 'All',
      sortBy: 'CompDate',
      sortDescending: true,
      page: 1,
      pageSize: 20,
    });
  };

  const handleSort = (columnKey) => {
    setQuery((prev) => {
      const isSame = prev.sortBy?.toLowerCase() === columnKey.toLowerCase();
      const nextDesc = isSame ? !prev.sortDescending : false;
      return {
        ...prev,
        sortBy: columnKey,
        sortDescending: nextDesc,
        page: 1,
      };
    });
  };

  const renderSortIcon = (columnKey) => {
    const isCurrent = query.sortBy?.toLowerCase() === columnKey.toLowerCase();
    if (!isCurrent) {
      return <ArrowUpDown size={12} style={{ color: '#94A3B8', marginLeft: 4, flexShrink: 0 }} />;
    }
    return query.sortDescending ? (
      <ArrowDown size={12} style={{ color: '#0D3B66', marginLeft: 4, flexShrink: 0 }} />
    ) : (
      <ArrowUp size={12} style={{ color: '#0D3B66', marginLeft: 4, flexShrink: 0 }} />
    );
  };

  const handlePageSizeChange = (newSize) => {
    setQuery((prev) => ({
      ...prev,
      pageSize: newSize,
      page: 1,
    }));
  };

  const activeChips = [];
  if (query.district !== 'All') activeChips.push({ label: `District: ${query.district}`, onRemove: () => setQuery({ ...query, district: 'All', page: 1 }) });
  if (query.category !== 'All') activeChips.push({ label: `Category: ${query.category}`, onRemove: () => setQuery({ ...query, category: 'All', page: 1 }) });
  if (query.status !== 'All') activeChips.push({ label: `Status: ${query.status}`, onRemove: () => setQuery({ ...query, status: 'All', page: 1 }) });
  if (query.officer !== 'All') activeChips.push({ label: `Officer: ${query.officer === 'Unassigned' ? 'Unassigned (Missing)' : query.officer}`, onRemove: () => setQuery({ ...query, officer: 'All', page: 1 }) });
  if (query.ageBucket !== 'All') activeChips.push({ label: `Age: ${query.ageBucket}`, onRemove: () => setQuery({ ...query, ageBucket: 'All', page: 1 }) });
  if (query.riskCategory !== 'All') activeChips.push({ label: `Risk: ${query.riskCategory}`, onRemove: () => setQuery({ ...query, riskCategory: 'All', riskOnly: false, page: 1 }) });
  if (query.grievanceType !== 'All') activeChips.push({ label: `Type: ${query.grievanceType}`, onRemove: () => setQuery({ ...query, grievanceType: 'All', page: 1 }) });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0D3B66', mb: 0.5 }}>
          Grievance Explorer & Case Lookup
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Search, filter, and inspect granular grievance cases with automatic privacy masking and audit transition history.
        </Typography>
      </Box>

      {/* Active Drill-Down Chips Banner */}
      {activeChips.length > 0 && (
        <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF', mr: 0.5 }}>
              ACTIVE DRILL-DOWN FILTERS:
            </Typography>
            {activeChips.map((chip, idx) => (
              <Chip
                key={idx}
                label={chip.label}
                onDelete={chip.onRemove}
                size="small"
                color="primary"
                sx={{ fontSize: '0.75rem', fontWeight: 600, bgcolor: '#DBEAFE', color: '#1E3A8A' }}
              />
            ))}
          </Box>
          <Button
            size="small"
            onClick={handleResetFilters}
            sx={{ fontSize: '0.75rem', color: '#EF4444', textTransform: 'none', fontWeight: 600 }}
          >
            Clear All Drill-Down Filters
          </Button>
        </Paper>
      )}

      {/* Filter and Search Bar */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <form onSubmit={handleSearchSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search Citizen Name, CompId, Hospital, Remarks..."
                value={query.searchTerm}
                onChange={(e) => setQuery({ ...query, searchTerm: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={18} color="#64748B" />
                      </InputAdornment>
                    ),
                  }
                }}
              />
            </Grid>

            <Grid item xs={6} sm={4} md={1.8}>
              <FormControl fullWidth size="small">
                <InputLabel>District</InputLabel>
                <Select
                  value={query.district}
                  label="District"
                  onChange={(e) => setQuery({ ...query, district: e.target.value, page: 1 })}
                >
                  <MenuItem value="All">All Districts</MenuItem>
                  {filterOptions.districts?.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={query.category}
                  label="Category"
                  onChange={(e) => setQuery({ ...query, category: e.target.value, page: 1 })}
                >
                  <MenuItem value="All">All Categories</MenuItem>
                  {filterOptions.categories?.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={4} md={1.8}>
              <FormControl fullWidth size="small">
                <InputLabel>Officer</InputLabel>
                <Select
                  value={query.officer}
                  label="Officer"
                  onChange={(e) => setQuery({ ...query, officer: e.target.value, page: 1 })}
                >
                  <MenuItem value="All">All Officers</MenuItem>
                  <MenuItem value="Unassigned">Unassigned (Missing)</MenuItem>
                  {filterOptions.officers?.map((o) => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={1.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={query.status}
                  label="Status"
                  onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })}
                >
                  <MenuItem value="All">All Statuses</MenuItem>
                  <MenuItem value="Pending">All Pending</MenuItem>
                  <MenuItem value="Open">Open</MenuItem>
                  <MenuItem value="WIP">WIP</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={1.2}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                sx={{ bgcolor: '#0D3B66', py: 0.9, textTransform: 'none', fontWeight: 600 }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Grievance Grid */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.9rem' }}>
              Matching Records: {data.totalCount?.toLocaleString()}
            </Typography>
            <Chip
              label={`Page ${query.page} of ${data.totalPages || 1}`}
              size="small"
              sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#475569' }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Rows per page:
            </Typography>
            <FormControl size="small">
              <Select
                value={query.pageSize || 20}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                sx={{
                  height: 30,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  bgcolor: '#F8FAFC',
                  borderRadius: '6px',
                  '& .MuiSelect-select': { py: '4px', pr: '24px !important', pl: '8px' }
                }}
              >
                <MenuItem value={10} sx={{ fontSize: '0.75rem' }}>10</MenuItem>
                <MenuItem value={20} sx={{ fontSize: '0.75rem' }}>20</MenuItem>
                <MenuItem value={50} sx={{ fontSize: '0.75rem' }}>50</MenuItem>
                <MenuItem value={100} sx={{ fontSize: '0.75rem' }}>100</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress color="primary" size={36} sx={{ mb: 1.5 }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Querying grievance records from database...
            </Typography>
          </Box>
        ) : data.items?.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              No grievances found matching the current search parameters.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <Table size="small" sx={{ minWidth: 1060 }}>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell
                    onClick={() => handleSort('compid')}
                    sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#334155', cursor: 'pointer', userSelect: 'none', width: 95, whiteSpace: 'nowrap' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      CompId {renderSortIcon('compid')}
                    </Box>
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('compdate')}
                    sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#334155', cursor: 'pointer', userSelect: 'none', width: 105, whiteSpace: 'nowrap' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Reg. Date {renderSortIcon('compdate')}
                    </Box>
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('status')}
                    sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#334155', cursor: 'pointer', userSelect: 'none', width: 85, whiteSpace: 'nowrap' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Status {renderSortIcon('status')}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#334155', minWidth: 130 }}>
                    Citizen (Masked)
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('district')}
                    sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#334155', cursor: 'pointer', userSelect: 'none', minWidth: 110 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      District {renderSortIcon('district')}
                    </Box>
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('category')}
                    sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#334155', cursor: 'pointer', userSelect: 'none', minWidth: 180 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Grievance Category {renderSortIcon('category')}
                    </Box>
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('officer')}
                    sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#334155', cursor: 'pointer', userSelect: 'none', minWidth: 140 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Assigned Officer {renderSortIcon('officer')}
                    </Box>
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('ageindays')}
                    sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#334155', cursor: 'pointer', userSelect: 'none', width: 100, whiteSpace: 'nowrap' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Age {renderSortIcon('ageindays')}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#334155', width: 100, whiteSpace: 'nowrap' }}>
                    Risk
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#334155', textAlign: 'center', width: 90, minWidth: 90, whiteSpace: 'nowrap' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((g) => (
                  <TableRow key={g.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedGrievanceId(g.id)}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#0D3B66', whiteSpace: 'nowrap' }}>
                      #{g.compId}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{g.compDate}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge-${g.status?.toLowerCase()}`}>
                        {g.status}
                      </span>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                      {g.citizenName}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{g.beneficiaryDistrict || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{g.grievanceCategory}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>
                      {g.officerName ? (
                        g.officerName
                      ) : (
                        <Chip label="Unassigned" size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      <Chip
                        label={`${g.ageInDays}d (${g.ageBucket})`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: g.ageInDays > 60 ? '#FEE2E2' : (g.ageInDays > 30 ? '#FEF3C7' : '#F1F5F9'),
                          color: g.ageInDays > 60 ? '#B91C1C' : (g.ageInDays > 30 ? '#B45309' : '#475569'),
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {g.isRiskFlagged ? (
                        <Chip
                          icon={<AlertTriangle size={12} color="#DC2626" />}
                          label={g.riskCategory || 'Risk'}
                          size="small"
                          color="error"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>-</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', width: 90, minWidth: 90, whiteSpace: 'nowrap' }}>
                      <Button
                        size="small"
                        startIcon={<Eye size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGrievanceId(g.id);
                        }}
                        sx={{ fontSize: '0.72rem', py: 0.2, px: 1, whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600 }}
                      >
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={data.totalPages || 1}
            page={query.page}
            onChange={(e, p) => setQuery({ ...query, page: p })}
            color="primary"
            shape="rounded"
          />
        </Box>
      </Paper>

      {/* Detail Modal */}
      {selectedGrievanceId && (
        <GrievanceDetailModal
          open={!!selectedGrievanceId}
          onClose={() => setSelectedGrievanceId(null)}
          grievanceId={selectedGrievanceId}
        />
      )}
    </Box>
  );
}
