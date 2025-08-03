import axios from 'axios';

const BASE_URL = "http://localhost:8080/api/v1";

export const fetchPosts = () => axios.get(BASE_URL);
export const fetchPostDetail = (postId: number) => axios.get(`${BASE_URL}/${postId}`);
export const createPost = (data: any) => axios.post(BASE_URL, data);
export const updatePost = (postId: number, data: any) => axios.put(`${BASE_URL}/${postId}`, data);
export const deletePost = (postId: number) => axios.delete(`${BASE_URL}/${postId}`);
export const likePost = (postId: number) => axios.post(`${BASE_URL}/${postId}/like`);
export const scrapPost = (postId: number) => axios.post(`${BASE_URL}/${postId}/scrap`);
export const fetchPopularPosts = () => axios.get(`${BASE_URL}/popular`);
