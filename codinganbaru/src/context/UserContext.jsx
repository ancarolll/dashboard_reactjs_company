// import React, { createContext, useState, useEffect } from 'react';
// import axios from 'axios';


// const API_BASE_URL = 'http://localhost:3005/api';

// // Mapping nama project
// export const PROJECT_NAMES = {
//   elnusa: 'PT. Elnusa',
//   regional4: 'PT. Pertamina Ep Regional 4',
//   regional2eksplorasi: 'PT. Pertamina Ep Regional 2 (Eksplorasi)',
//   regional2subsurface: 'PT. Pertamina Ep Regional 2 (Subsurface)',
//   perDuaZTujhDev: 'PT. Pertamina Ep Regional 2 Zona 7 (DevPlan)',
//   perDuaZTujhWopdm: 'PT. Pertamina Ep Regional 2 Zona 7 (WOPDM)',
//   umran: 'PT. Umran Rubi Perkasa'
// };

// // Daftar project IDs
// export const PROJECT_IDS = Object.keys(PROJECT_NAMES);

// // Create context
// export const UserContext = createContext({
//   users: [],
//   inactiveUsers: [],
//   projectUsers: {},
//   projectInactiveUsers: {},
//   addUser: () => {},
//   deleteUser: () => {},
//   editUser: () => {},
//   deleteInactiveUser: () => {},
//   moveToInactive: () => {},
//   restoreUser: () => {},
//   purgeOldInactiveUsers: () => {}
// });

// // Context provider component
// export const UserProvider = ({ children }) => {
//   // Fungsi untuk validasi dan normalisasi format tanggal
//   const validateDate = (dateString) => {
//     if (!dateString) return null;
    
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) return null;
      
//       // Format ke YYYY-MM-DD untuk konsistensi
//       return date.toISOString().split('T')[0];
//     } catch (e) {
//       console.error("Error validating date:", e);
//       return null;
//     }
//   };

//   // Fungsi untuk menghitung hari yang tersisa dari tanggal kontrak akhir
//   const getDaysDifference = (endDate) => {
//     if (!endDate) return -999;
    
//     try {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0); // Reset waktu ke 00:00:00
      
//       const endDateObj = new Date(endDate);
//       endDateObj.setHours(0, 0, 0, 0); // Reset waktu ke 00:00:00
      
//       // Gunakan UTC untuk menghindari masalah timezone
//       const diffTime = endDateObj.getTime() - today.getTime();
//       return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     } catch (e) {
//       console.error("Error calculating date difference:", e);
//       return -999;
//     }
//   };

//   // Initialize state using localStorage for persistence with date validation
//   const [users, setUsers] = useState(() => {
//     try {
//       const savedUsers = localStorage.getItem('users');
//       console.log("Data dari localStorage:", savedUsers);
      
//       if (!savedUsers) return [];
      
//       const parsedUsers = JSON.parse(savedUsers);
      
//       // Validasi setiap user dan format tanggal
//       return parsedUsers.map(user => ({
//         ...user,
//         kontrakAwal: validateDate(user.kontrakAwal),
//         kontrakAkhir: validateDate(user.kontrakAkhir),
//         tanggal: validateDate(user.tanggal)
//       }));
//     } catch (e) {
//       console.error("Error parsing users from localStorage:", e);
//       return [];
//     }
//   });

//   // Initialize projectUsers state to store users by project
//   const [projectUsers, setProjectUsers] = useState(() => {
//     // Buat object kosong dengan key untuk setiap project
//     const emptyProjectUsers = {};
//     PROJECT_IDS.forEach(projectId => {
//       emptyProjectUsers[projectId] = [];
//     });
//     return emptyProjectUsers;
//   });

//   // Initialize inactive users state
//   const [inactiveUsers, setInactiveUsers] = useState(() => {
//     try {
//       const savedInactiveUsers = localStorage.getItem('inactiveUsers');
//       console.log("Data inactive users dari localStorage:", savedInactiveUsers);
      
//       if (!savedInactiveUsers) return [];
      
//       const parsedInactiveUsers = JSON.parse(savedInactiveUsers);
      
//       // Validasi setiap user dan format tanggal
//       return parsedInactiveUsers.map(user => ({
//         ...user,
//         kontrakAwal: validateDate(user.kontrakAwal),
//         kontrakAkhir: validateDate(user.kontrakAkhir),
//         tanggal: validateDate(user.tanggal)
//       }));
//     } catch (e) {
//       console.error("Error parsing inactive users from localStorage:", e);
//       return [];
//     }
//   });

//   // Initialize projectInactiveUsers state
//   const [projectInactiveUsers, setProjectInactiveUsers] = useState(() => {
//     // Buat object kosong dengan key untuk setiap project
//     const emptyProjectInactiveUsers = {};
//     PROJECT_IDS.forEach(projectId => {
//       emptyProjectInactiveUsers[projectId] = [];
//     });
//     return emptyProjectInactiveUsers;
//   });

//   // Perbaikan penyimpanan data ke localStorage dengan debounce
//   useEffect(() => {
//     try {
//       console.log('Menyimpan data users ke localStorage:', users);
      
//       // Simpan langsung ke localStorage tanpa debounce untuk data penting
//       localStorage.setItem('users', JSON.stringify(users));
      
//       console.log('Data users berhasil disimpan, jumlah:', users.length);
//     } catch (error) {
//       console.error("Error saving users to localStorage:", error);
//     }
//   }, [users]);

//   // Perbaikan penyimpanan inactive users ke localStorage dengan debounce
//   useEffect(() => {
//     const saveInactiveToLocalStorage = () => {
//       try {
//         console.log('Menyimpan data inactive users ke localStorage:', inactiveUsers);
        
//         // Deep clone dan validasi objek sebelum menyimpan
//         const validatedInactiveUsers = inactiveUsers.map(user => ({
//           ...user,
//           kontrakAwal: validateDate(user.kontrakAwal),
//           kontrakAkhir: validateDate(user.kontrakAkhir),
//           tanggal: validateDate(user.tanggal)
//         }));
        
//         localStorage.setItem('inactiveUsers', JSON.stringify(validatedInactiveUsers));
//       } catch (error) {
//         console.error("Error saving inactive users to localStorage:", error);
//       }
//     };
    
//     // Gunakan timeout untuk debounce
//     const timeoutId = setTimeout(saveInactiveToLocalStorage, 300);
//     return () => clearTimeout(timeoutId);
//   }, [inactiveUsers]);

//   // Migrasi data user yang belum memiliki projectId
//   useEffect(() => {
//     const migrateExistingUsers = () => {
//       setUsers(prevUsers => {
//         return prevUsers.map(user => {
//           if (!user.projectId) {
//             return { ...user, projectId: 'elnusa' }; // Default ke elnusa
//           }
//           return user;
//         });
//       });
      
//       setInactiveUsers(prevUsers => {
//         return prevUsers.map(user => {
//           if (!user.projectId) {
//             return { ...user, projectId: 'elnusa' }; // Default ke elnusa
//           }
//           return user;
//         });
//       });
//     };

//     migrateExistingUsers();
//   }, []);

//   // Efek untuk memisahkan users berdasarkan project
//   useEffect(() => {
//     if (users && Array.isArray(users)) {
//       // Reset projectUsers
//       const newProjectUsers = {};
//       PROJECT_IDS.forEach(projectId => {
//         newProjectUsers[projectId] = [];
//       });

//       // Distribusikan users berdasarkan projectId
//       users.forEach(user => {
//         if (user && user.projectId) {
//           // Jika projectId ada dalam daftar project yang kita punya
//           if (newProjectUsers.hasOwnProperty(user.projectId)) {
//             newProjectUsers[user.projectId].push(user);
//           } else {
//             console.warn(`Unknown projectId: ${user.projectId}, defaulting to 'elnusa'`);
//             // Jika projectId tidak dikenal, masukkan ke elnusa
//             const userWithFixedProject = { ...user, projectId: 'elnusa' };
//             newProjectUsers.elnusa.push(userWithFixedProject);
//           }
//         } else {
//           // Jika tidak ada projectId, asumsikan elnusa (untuk kompatibilitas)
//           console.warn(`User without projectId, defaulting to 'elnusa':`, user);
//           const userWithFixedProject = { ...user, projectId: 'elnusa' };
//           newProjectUsers.elnusa.push(userWithFixedProject);
//         }
//       });

//       setProjectUsers(newProjectUsers);
//     }
//   }, [users]);

//   // Efek untuk memisahkan inactiveUsers berdasarkan project
//   useEffect(() => {
//     if (inactiveUsers && Array.isArray(inactiveUsers)) {
//       // Reset projectInactiveUsers
//       const newProjectInactiveUsers = {};
//       PROJECT_IDS.forEach(projectId => {
//         newProjectInactiveUsers[projectId] = [];
//       });

//       // Distribusikan inactiveUsers berdasarkan projectId
//       inactiveUsers.forEach(user => {
//         if (user && user.projectId) {
//           // Jika projectId ada dalam daftar project yang kita punya
//           if (newProjectInactiveUsers.hasOwnProperty(user.projectId)) {
//             newProjectInactiveUsers[user.projectId].push(user);
//           } else {
//             console.warn(`Unknown projectId in inactive: ${user.projectId}, defaulting to 'elnusa'`);
//             // Jika projectId tidak dikenal, masukkan ke elnusa
//             const userWithFixedProject = { ...user, projectId: 'elnusa' };
//             newProjectInactiveUsers.elnusa.push(userWithFixedProject);
//           }
//         } else {
//           // Jika tidak ada projectId, asumsikan elnusa (untuk kompatibilitas)
//           console.warn(`Inactive user without projectId, defaulting to 'elnusa':`, user);
//           const userWithFixedProject = { ...user, projectId: 'elnusa' };
//           newProjectInactiveUsers.elnusa.push(userWithFixedProject);
//         }
//       });

//       setProjectInactiveUsers(newProjectInactiveUsers);
//     }
//   }, [inactiveUsers]);

//   // Log statistik users untuk debugging
//   useEffect(() => {
//     console.log('Context values updated:');
//     console.log('Users:', users.length);
//     console.log('Inactive users:', inactiveUsers.length);
//   }, [users, inactiveUsers]);

//   // Add a new user with date validation
//   const addUser = async (newUser) => {
//         try {
//         if (!newUser.id) {
//             newUser.id = Date.now();
//         }
        
//         // Validasi format tanggal
//         const validatedUser = {
//             ...newUser,
//             kontrakAwal: validateDate(newUser.kontrakAwal),
//             kontrakAkhir: validateDate(newUser.kontrakAkhir),
//             tanggal: validateDate(newUser.tanggal),
//             projectId: newUser.projectId || 'elnusa' // Pastikan projectId ada
//         };
        
//         // Penanganan file yang benar
//         if (newUser.file && !validatedUser.fileInfo) {
//             validatedUser.fileInfo = newUser.file;
//         }
        
//         console.log("Menambahkan user baru (validated):", validatedUser);
    
//          // Update state
//         const updatedUsers = [...users, validatedUser];
//         setUsers(updatedUsers);
        
//         // Simpan langsung ke localStorage untuk pastikan data tersimpan
//         localStorage.setItem('users', JSON.stringify(updatedUsers));
        
//         return validatedUser;
//         } catch (error) {
//         console.error("Error adding user:", error);
//         throw error;
//         }
//   };

//   // Delete a user by ID
//   const deleteUser = (userId, reason = '') => {
//     try {
//       console.log("Menghapus user dengan id:", userId, "Alasan:", reason);

//       // Mencari user terlebih dahulu
//       const userToDelete = users.find(user => user.id === userId);

//       if (!userToDelete) {
//         console.error("User tidak ditemukan");
//         return;
//       }

//       // Validasi data user sebelum ditambahkan ke inactive
//       const validatedUser = {
//         ...userToDelete,
//         kontrakAwal: validateDate(userToDelete.kontrakAwal),
//         kontrakAkhir: validateDate(userToDelete.kontrakAkhir),
//         tanggal: validateDate(userToDelete.tanggal),
//         projectId: userToDelete.projectId || 'elnusa', // Pastikan projectId ada
//         naReason: reason,
//         naDate: new Date().toISOString()
//       };

//       setUsers(prevUsers => {
//         const filteredUsers = prevUsers.filter(user => user.id !== userId);
//         console.log('User deleted, remaining users:', filteredUsers.length);
//         return filteredUsers;
//       });
      
//       // Add to inactive users
//       setInactiveUsers(prevInactiveUsers => {
//         // Check if already in inactive list
//         if (prevInactiveUsers.some(user => user.id === userId)) {
//           return prevInactiveUsers;
//         }
//         return [...prevInactiveUsers, validatedUser];
//       });
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       throw error;
//     }
//   };
  
//   // Edit a user with enhanced validation
//   const editUser = async (updatedUser) => {
//     try {
//       if (!updatedUser || !updatedUser.id) {
//         throw new Error("Invalid user data for update");
//       }
      
//       // Pastikan projectId ada
//       if (!updatedUser.projectId) {
//         updatedUser.projectId = 'elnusa'; // Default ke elnusa
//       }
      
//       // Validasi format tanggal
//       const validatedUser = {
//         ...updatedUser,
//         kontrakAwal: validateDate(updatedUser.kontrakAwal),
//         kontrakAkhir: validateDate(updatedUser.kontrakAkhir),
//         tanggal: validateDate(updatedUser.tanggal)
//       };
      
//       // Penanganan file
//       if (updatedUser.file && !updatedUser.fileInfo) {
//         validatedUser.fileInfo = updatedUser.file;
//       }
      
//       console.log("Memperbarui user:", validatedUser);

//       setUsers(prevUsers => {
//         const userExists = prevUsers.some(user => user.id === validatedUser.id);
//         if (!userExists) {
//           console.warn("Attempted to update non-existent user:", validatedUser.id);
//           return prevUsers;
//         }
        
//         const updatedUsers = prevUsers.map(user => 
//           user.id === validatedUser.id ? validatedUser : user
//         );
//         console.log('User updated, total users:', updatedUsers.length);
//         return updatedUsers;
//       });
      
//       return validatedUser;
//     } catch (error) {
//       console.error("Error updating user:", error);
//       throw error;
//     }
//   };

//   // Delete an inactive user
//   const deleteInactiveUser = (userId) => {
//     try {
//       console.log("Menghapus inactive user dengan id:", userId);
      
//       setInactiveUsers(prevUsers => {
//         const filteredUsers = prevUsers.filter(user => user.id !== userId);
//         console.log('Inactive users after deletion:', filteredUsers.length);
//         return filteredUsers;
//       });
//     } catch (error) {
//       console.error("Error deleting inactive user:", error);
//       throw error;
//     }
//   };
  
//   // Move a user to inactive with enhanced validation
//   const moveToInactive = (user, reason = 'EOC') => {
//     try {
//       if (!user || !user.id) {
//         console.error("Invalid user data for moving to inactive");
//         return;
//       }
      
//       console.log("Moving user to inactive:", user.nama || user.id, "Reason:", reason);
      
//       // Validasi data user sebelum proses
//       const validatedUser = {
//         ...user,
//         kontrakAwal: validateDate(user.kontrakAwal),
//         kontrakAkhir: validateDate(user.kontrakAkhir),
//         tanggal: validateDate(user.tanggal),
//         projectId: user.projectId || 'elnusa', // Pastikan projectId ada
//         naReason: reason,
//         naDate: new Date().toISOString()
//       };
      
//       // Hapus user dari daftar aktif (hanya sekali)
//       setUsers(prevUsers => prevUsers.filter(u => u.id !== validatedUser.id));
  
//       // Tambahkan ke daftar inaktif jika belum ada
//       setInactiveUsers(prevInactiveUsers => {
//         // Cek apakah user sudah ada di daftar inaktif
//         const existingIndex = prevInactiveUsers.findIndex(u => u.id === validatedUser.id);
        
//         if (existingIndex >= 0) {
//           // Jika sudah ada, perbarui data dengan alasan baru
//           console.log("User sudah ada di daftar inaktif, memperbarui dengan alasan baru");
//           const updatedList = [...prevInactiveUsers];
//           updatedList[existingIndex] = validatedUser;
//           return updatedList;
//         } else {
//           // Jika belum ada, tambahkan ke daftar
//           console.log("Menambahkan user ke daftar inaktif");
//           return [...prevInactiveUsers, validatedUser];
//         }
//       });
//     } catch (error) {
//       console.error("Error moving user to inactive:", error);
//       throw error;
//     }
//   };
  
//   // Restore a user from inactive to active with enhanced validation
//   const restoreUser = async (updatedUser) => {
//     try {
//       if (!updatedUser || !updatedUser.id) {
//         throw new Error("Invalid user data for restoration");
//       }
      
//       console.log("Restoring user:", updatedUser.nama || updatedUser.id);

//       // Bersihkan properti yang tidak diperlukan lagi
//       const { naReason, naDate, ...userBase } = updatedUser;
      
//       // Validasi data user sebelum dipulihkan
//       const validatedUser = {
//         ...userBase,
//         kontrakAwal: validateDate(userBase.kontrakAwal),
//         kontrakAkhir: validateDate(userBase.kontrakAkhir),
//         tanggal: validateDate(userBase.tanggal),
//         projectId: userBase.projectId || 'elnusa' // Pastikan projectId ada
//       };
      
//       // Remove from inactive users
//       setInactiveUsers(prevUsers => prevUsers.filter(u => u.id !== validatedUser.id));
      
//       // Add to active users with updated data
//       setUsers(prevUsers => [...prevUsers, validatedUser]);
      
//       return validatedUser;
//     } catch (error) {
//       console.error("Error restoring user:", error);
//       throw error;
//     }
//   };
  
//   // Purge old inactive users (over a certain number of days)
//   const purgeOldInactiveUsers = (dayThreshold) => {
//     try {
//       console.log(`Purging inactive users older than ${dayThreshold} days`);
      
//       const now = new Date();
//       now.setHours(0, 0, 0, 0); // Reset waktu untuk perbandingan yang akurat
      
//       const filteredUsers = inactiveUsers.filter(user => {
//         if (!user.kontrakAkhir) return true; // Keep if no end date
        
//         try {
//           const endDate = new Date(user.kontrakAkhir);
//           endDate.setHours(0, 0, 0, 0); // Reset waktu untuk perbandingan yang akurat
          
//           const diffTime = now.getTime() - endDate.getTime();
//           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
//           // Keep users whose contract ended less than the threshold days ago
//           return diffDays < dayThreshold;
//         } catch (e) {
//           console.error("Error calculating days for purge:", e, user);
//           return true; // Pertahankan jika ada error dalam kalkulasi
//         }
//       });
      
//       const purgedCount = inactiveUsers.length - filteredUsers.length;
//       console.log(`Purged ${purgedCount} users`);
      
//       if (purgedCount > 0) {
//         setInactiveUsers(filteredUsers);
//       }
//       return purgedCount;
//     } catch (error) {
//       console.error("Error purging old inactive users:", error);
//       return 0;
//     }
//   };

//   // Fungsi untuk menyinkronkan data dari backend ke context
// const syncWithBackend = (backendData, projectId = 'elnusa') => {
//   try {
//     // Filter user yang sudah ada dari project tertentu
//     const otherProjectUsers = users.filter(user => user.projectId !== projectId);
    
//     // Format data backend untuk context
//     const formattedData = backendData.map(item => ({
//       ...item,
//       id: item.id || Date.now(),
//       projectId: projectId,
//       // Validasi tanggal
//       kontrakAwal: validateDate(item.kontrak_awal),
//       kontrakAkhir: validateDate(item.kontrak_akhir),
//       tanggal: validateDate(item.tanggal_lahir)
//     }));
    
//     // Update users dengan data baru
//     setUsers([...otherProjectUsers, ...formattedData]);
//     return formattedData;
//   } catch (error) {
//     console.error("Error syncing with backend:", error);
//     return [];
//   }
// };

// // Fungsi untuk mendapatkan user berdasarkan no_kontrak
// const getUserByNoKontrak = (noKontrak, projectId = 'elnusa') => {
//   if (!noKontrak) return null;
  
//   // Cari di project yang ditentukan dulu
//   if (projectUsers[projectId]) {
//     const user = projectUsers[projectId].find(u => 
//       u.no_kontrak === noKontrak || u.nokontrak === noKontrak
//     );
//     if (user) return user;
//   }
  
//   // Cari di semua user jika tidak ditemukan
//   return users.find(u => u.no_kontrak === noKontrak || u.nokontrak === noKontrak) || null;
// };

// // Update user berdasarkan no_kontrak
// const updateUserByNoKontrak = async (noKontrak, userData, projectId = 'elnusa') => {
//   try {
//     const user = getUserByNoKontrak(noKontrak, projectId);
//     if (!user) {
//       throw new Error(`User dengan no_kontrak ${noKontrak} tidak ditemukan`);
//     }
    
//     return await editUser({
//       ...user,
//       ...userData,
//       id: user.id,
//       projectId
//     });
//   } catch (error) {
//     console.error("Error updating user by no_kontrak:", error);
//     throw error;
//   }
// };

// // Fungsi untuk mendapatkan data karyawan non-aktif dari API
// const fetchNonActiveUsers = async (projectId = 'elnusa') => {
//   try {
//     const response = await axios.get(`${API_BASE_URL}/${projectId}/nonactive`);
//     console.log('Data non-aktif dari API:', response.data);
    
//     // Update state inactive users untuk project tertentu
//     const formattedData = response.data.map(item => ({
//       ...item,
//       id: item.id || Date.now(),
//       projectId: projectId,
//       // Mapping nama field dari database ke format context
//       nama: item.nama_karyawan,
//       nomorid: item.nik_vendor,
//       nokontrak: item.no_kontrak,
//       kontrakAwal: validateDate(item.kontrak_awal),
//       kontrakAkhir: validateDate(item.kontrak_akhir),
//       tanggal: validateDate(item.tanggal_lahir),
//       naReason: item.na_reason || 'EOC',
//       naDate: validateDate(item.na_date)
//     }));
    
//     // Filter inactive users dari project lain
//     const otherProjectInactiveUsers = inactiveUsers.filter(user => 
//       user.projectId !== projectId
//     );
    
//     // Update state dengan data gabungan
//     setInactiveUsers([...otherProjectInactiveUsers, ...formattedData]);
    
//     return formattedData;
//   } catch (error) {
//     console.error('Error fetching non-active users:', error);
//     return [];
//   }
// };

// // Fungsi untuk menghapus karyawan non-aktif melalui API
// const deleteNonActiveUserByAPI = async (noKontrak, projectId = 'elnusa') => {
//   try {
//     const response = await axios.delete(`${API_BASE_URL}/${projectId}/nonactive/${noKontrak}`);
//     console.log('User non-aktif dihapus:', response.data);
    
//     // Perbarui state setelah penghapusan
//     fetchNonActiveUsers(projectId);
    
//     return response.data;
//   } catch (error) {
//     console.error('Error menghapus user non-aktif:', error);
//     throw error;
//   }
// };

// // Fungsi untuk memulihkan karyawan non-aktif melalui API
// const restoreUserByAPI = async (noKontrak, userData, projectId = 'elnusa') => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/${projectId}/restore/${noKontrak}`, userData);
//     console.log('User dipulihkan ke status aktif:', response.data);
    
//     // Perbarui data setelah pemulihan
//     fetchNonActiveUsers(projectId);
    
//     return response.data;
//   } catch (error) {
//     console.error('Error memulihkan user:', error);
//     throw error;
//   }
// };

// const contextValue = {
//   users,
//   inactiveUsers,
//   projectUsers,
//   projectInactiveUsers,
//   addUser,
//   deleteUser,
//   editUser,
//   deleteInactiveUser,
//   moveToInactive,
//   restoreUser,
//   purgeOldInactiveUsers,
//   syncWithBackend,
//   getUserByNoKontrak,
//   updateUserByNoKontrak,
//   fetchNonActiveUsers,        // Fungsi baru untuk API
//   deleteNonActiveUserByAPI,   // Fungsi baru untuk API
//   restoreUserByAPI            // Fungsi baru untuk API
// };

//   return (
//     <UserContext.Provider value={contextValue}>
//       {children}
//     </UserContext.Provider>
//   );
// };