import * as clientService from "../services/clientServices.js"


export const getClients = async (req, res) => {
    try {
        const clients = await clientService.getClients();
        res.status(200).json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

export const getClientByContract = async (req, res) => {
    try {
        const no_kontrak = req.params.no_kontrak;
        
        if (!no_kontrak) {
        return res.status(400).json({message: 'Nomor kontrak diperlukan'});
        }
        
        const client = await clientService.getClientByContract(no_kontrak);
        
        if (!client) {
        return res.status(404).json({message: 'Karyawan tidak ditemukan'});
        }
        
        res.status(200).json(client);
    } catch (error) {
        console.error('Error saat mencari karyawan:', error);
        res.status(500).json({message: 'Terjadi kesalahan di server internal'});
    }
};

export const createClient = async (req, res) => {
    try {
    const elnusaData = req.body;
      
      // Validasi data minimal yang diperlukan
    if (!elnusaData.nama_karyawan) {
        return res.status(400).json({
        message: 'Nama karyawan diperlukan'
        });
    }
    
    const newClient = await clientService.createClient(elnusaData);
    res.status(201).json(newClient); // 201 Created
    }catch (error) {
    console.error('Error saat membuat data karyawan:', error);
    res.status(500).json({message: 'Terjadi kesalahan di server internal'});
    }
};

export const updateClient = async (req, res) => {
    try {
        const no_kontrak = req.params.no_kontrak; // Mengambil no_kontrak dari parameter URL
        const elnusaData = req.body;
        // Validasi nomor kontrak
        if (!no_kontrak) {
            return res.status(400).json({
                message: 'Contract number is required'
            });
        }
        // Validasi data update
        if (!elnusaData || Object.keys(elnusaData).length === 0) {
            return res.status(400).json({
                message: 'Update data is required'
            });
        }
        const updatedClient = await clientService.updateClient(elnusaData, no_kontrak);
        if (!updatedClient) {
            return res.status(404).json({
                message: 'Client not found'
            });
        }
        res.status(200).json(updatedClient);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

export const deleteClient = async (req, res) => {
    try {
      const no_kontrak = req.params.no_kontrak;
      
      if (!no_kontrak) {
        return res.status(400).json({message: 'Nomor kontrak diperlukan'});
      }
      
      const deletedClient = await clientService.deleteClient(no_kontrak);
      
      if (!deletedClient) {
        return res.status(404).json({message: 'Karyawan tidak ditemukan'});
      }
      
      res.status(200).json({
        message: 'Karyawan berhasil dihapus',
        data: deletedClient
      });
    } catch (error) {
      console.error('Error saat menghapus karyawan:', error);
      res.status(500).json({message: 'Terjadi kesalahan di server internal'});
    }
  };
  

  export const getNonActiveClients = async (req, res) => {
    try {
      const nonActiveClients = await clientService.getNonActiveClients();
      res.status(200).json(nonActiveClients);
    } catch (error) {
      console.error('Error saat mengambil karyawan non-aktif:', error);
      res.status(500).json({
        message: 'Terjadi kesalahan di server internal',
        error: error.message
      });
    }
  };

  export const deleteNonActiveClient = async (req, res) => {
    try {
      const no_kontrak = req.params.no_kontrak;
      
      if (!no_kontrak) {
        return res.status(400).json({message: 'Nomor kontrak diperlukan'});
      }
      
      const deletedClient = await clientService.deleteNonActiveClient(no_kontrak);
      
      if (!deletedClient) {
        return res.status(404).json({message: 'Karyawan non-aktif tidak ditemukan'});
      }
      
      res.status(200).json({
        message: 'Karyawan non-aktif berhasil dihapus',
        data: deletedClient
      });
    } catch (error) {
      console.error('Error saat menghapus karyawan non-aktif:', error);
      res.status(500).json({
        message: 'Terjadi kesalahan di server internal',
        error: error.message
      });
    }
  };

  export const restoreNonActiveClient = async (req, res) => {
    try {
      const no_kontrak = req.params.no_kontrak;
      const userData = req.body;
      
      if (!no_kontrak) {
        return res.status(400).json({message: 'Nomor kontrak diperlukan'});
      }
      
      if (!userData || Object.keys(userData).length === 0) {
        return res.status(400).json({message: 'Data pemulihan diperlukan'});
      }
      
      const restoredClient = await clientService.restoreNonActiveClient(no_kontrak, userData);
      
      if (!restoredClient) {
        return res.status(404).json({message: 'Karyawan non-aktif tidak ditemukan'});
      }
      
      res.status(200).json({
        message: 'Karyawan berhasil dipulihkan menjadi aktif',
        data: restoredClient
      });
    } catch (error) {
      console.error('Error saat memulihkan karyawan:', error);
      res.status(500).json({
        message: 'Terjadi kesalahan di server internal',
        error: error.message
      });
    }
  };