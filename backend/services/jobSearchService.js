// JSearch API is the only way to get true Global Job Portals (LinkedIn, Indeed, Glassdoor, etc.)
// JSearch supported employment_type values: FULLTIME, CONTRACTOR, PARTTIME, INTERN
export const searchRealJobs = async (query, filters = {}) => {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    
    if (!rapidApiKey || rapidApiKey === 'your_rapidapi_key_here') {
       throw new Error("RAPIDAPI_KEY_MISSING");
    }

    // Build smart query — append location to query string for best results
    let searchQuery = query;
    if (filters.location && filters.location !== 'any') {
      searchQuery = `${query} in ${filters.location}`;
    }
    if (filters.remote === 'true') {
      searchQuery = `${query} remote`;
    }

    const params = new URLSearchParams({
      query: searchQuery,
      page: '1',
      num_pages: '1',
    });

    // JSearch employment_type filter: FULLTIME, PARTTIME, CONTRACTOR, INTERN
    if (filters.employment_type && filters.employment_type !== 'any') {
      params.append('employment_types', filters.employment_type);
    }

    // JSearch remote jobs filter
    if (filters.remote === 'true') {
      params.append('remote_jobs_only', 'true');
    }

    const url = `https://jsearch.p.rapidapi.com/search?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com'
      }
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("RAPIDAPI_KEY_INVALID");
    }

    if (!response.ok) {
      throw new Error(`Job Search API failed with status ${response.status}`);
    }

    const data = await response.json();
    const maxResults = (data.data || []).slice(0, 15);

    return maxResults.map(job => ({
      title: job.job_title || 'Untitled',
      company: job.employer_name || 'Unknown',
      location: job.job_city ? `${job.job_city}, ${job.job_state || ''}` : (job.job_is_remote ? 'Global Remote' : 'Not specified'),
      description: job.job_description || 'No description provided.',
      salary_range: job.job_min_salary ? `$${Math.round(job.job_min_salary).toLocaleString()} - $${Math.round(job.job_max_salary).toLocaleString()}` : 'Not disclosed',
      apply_url: job.job_apply_link || job.job_google_link || '',
      employer_logo: job.employer_logo || '',
      job_type: job.job_employment_type || 'FULLTIME',
      posted_date: job.job_posted_at_datetime_utc || '',
      is_remote: job.job_is_remote || false,
    }));

  } catch (error) {
    throw error;
  }
};

