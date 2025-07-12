import axios from "axios";

const chronoAPI = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export default chronoAPI;
