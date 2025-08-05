import axios from 'axios';

export const fbPost = async (post) => {
  const url = `https://graph.facebook.com/v21.0/${process.env.FACEBOOK_PAGE_ID}/feed`;
  
  const params = {
    access_token: process.env.FACEBOOK_ACCESS_TOKEN,
    message: post
  };

  try {
    const response = await axios.post(url, null, { params });
    console.log('Facebook post created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error posting to Facebook:', error.response ? error.response.data : error.message);
    throw error;
  }
}; 