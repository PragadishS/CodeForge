import axios from 'axios';

// Problems API
export const getProblems = async (page = 1, limit = 10, filters = {}) => {
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(filters.difficulty && { difficulty: filters.difficulty }),
    ...(filters.tags && { tags: filters.tags.join(',') }),
    ...(filters.search && { search: filters.search })
  });
  
  return axios.get(`/api/problems?${queryParams.toString()}`);
};

export const getProblemById = async (id) => {
  return axios.get(`/api/problems/${id}`);
};

export const createProblem = async (problemData) => {
  return axios.post(`/api/problems`, problemData);
};

export const updateProblem = async (id, problemData) => {
  return axios.put(`/api/problems/${id}`, problemData);
};

export const deleteProblem = async (id) => {
  return axios.delete(`/api/problems/${id}`);
};

export const getAllTags = async () => {
  return axios.get(`/api/problems/tags`);
};

// Submissions API
export const submitSolution = async (problemId, code, language) => {
  return axios.post(`/api/submissions`, { problemId, code, language });
};

export const getSubmissionById = async (id) => {
  return axios.get(`/api/submissions/${id}`);
};

export const getSubmissionsByProblem = async (problemId, page = 1, limit = 10) => {
  return axios.get(`/api/submissions/problem/${problemId}?page=${page}&limit=${limit}`);
};

export const getUserSubmissions = async (page = 1, limit = 10) => {
  return axios.get(`/api/submissions/user/me?page=${page}&limit=${limit}`);
};