import axiosInstance from '@/services/axiosInstance';

export interface Group {
  id: number;
  name: string;
  icon: string | null;
  sensorIds: number[];
}

const GroupService = {
  async getAllGroups(): Promise<Group[]> {
    const r = await axiosInstance.get<Group[]>('/groups');
    return r.data;
  },

  async createGroup(name: string, icon?: string): Promise<Group> {
    const r = await axiosInstance.post<Group>('/groups', { name, icon });
    return r.data;
  },

  async updateGroup(id: number, name: string, icon?: string): Promise<void> {
    await axiosInstance.put(`/groups/${id}`, { name, icon });
  },

  async deleteGroup(id: number): Promise<void> {
    await axiosInstance.delete(`/groups/${id}`);
  },

  async addSensor(groupId: number, sensorId: number): Promise<void> {
    await axiosInstance.post(`/groups/${groupId}/sensors/${sensorId}`);
  },

  async removeSensor(groupId: number, sensorId: number): Promise<void> {
    await axiosInstance.delete(`/groups/${groupId}/sensors/${sensorId}`);
  },
};

export default GroupService;
