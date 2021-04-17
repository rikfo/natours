import { showAlert } from './alert';
import axios from 'axios';

// update data
// tyoe === password || data
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updatepassword '
        : 'http://127.0.0.1:3000/api/v1/users/updateme';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} changed successfully!`);
      setTimeout(() => {
        location.assign('/me');
      }, 500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
