const useAuth = () => {
    const isAuthenticated = !!localStorage.getItem("token"); // Exemple simple
  
    return { isAuthenticated };
  };
  
  export default useAuth;