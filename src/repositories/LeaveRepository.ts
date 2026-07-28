// This repository is disabled - LeaveRequest and LeaveBalance models no longer exist in Prisma schema

export class LeaveRepository {
  constructor() {
    throw new Error('LeaveRepository is disabled');
  }

  async getLeaveBalance(userId: string, year: number): Promise<any> {
    throw new Error('LeaveRepository is disabled');
  }

  async createLeaveBalance(data: any): Promise<any> {
    throw new Error('LeaveRepository is disabled');
  }

  async updateLeaveBalance(userId: string, year: number, usedDays: number): Promise<any> {
    throw new Error('LeaveRepository is disabled');
  }

  async getUserLeaveBalances(userId: string): Promise<any[]> {
    throw new Error('LeaveRepository is disabled');
  }

  async createLeaveRequest(data: any): Promise<any> {
    throw new Error('LeaveRepository is disabled');
  }

  async getLeaveRequests(userId: string, status?: string): Promise<any[]> {
    throw new Error('LeaveRepository is disabled');
  }

  async updateLeaveRequestStatus(id: string, status: string): Promise<any> {
    throw new Error('LeaveRepository is disabled');
  }

  async deleteLeaveRequest(id: string): Promise<void> {
    throw new Error('LeaveRepository is disabled');
  }

  async getPendingRequests(departmentId?: string): Promise<any[]> {
    throw new Error('LeaveRepository is disabled');
  }
}

