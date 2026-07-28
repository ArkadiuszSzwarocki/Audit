import { prisma } from '../config/db';

export class UserRepository {
  /**
   * Pobiera użytkownika po ID
   */
  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * Pobiera kierownika użytkownika - NOT IMPLEMENTED
   */
  async getManager(userId: string) {
    return null;
  }

  /**
   * Pobiera wszystkich podwładnych użytkownika - NOT IMPLEMENTED
   */
  async getSubordinates(userId: string) {
    return [];
  }

  /**
   * Pobiera łańcuch kierowników - NOT IMPLEMENTED
   */
  async getManagerChain(userId: string): Promise<any[]> {
    return [];
  }

  /**
   * Przypisuje kierownika do pracownika - NOT IMPLEMENTED
   */
  async assignManager(userId: string, managerId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {}
    });
  }

  /**
   * Przypisuje stanowisko do pracownika - NOT IMPLEMENTED
   */
  async assignPosition(userId: string, positionId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {}
    });
  }

  /**
   * Przypisuje departament do pracownika - NOT IMPLEMENTED
   */
  async assignDepartment(userId: string, departmentId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {}
    });
  }

  /**
   * Aktualizuje parametry zmianowe pracownika
   */
  async updateShiftSettings(userId: string, data: any) {
    return await prisma.user.update({
      where: { id: userId },
      data
    });
  }

  /**
   * Pobiera wszystkich pracowników - approximation
   */
  async getByDepartmentId(departmentId: string) {
    return await prisma.user.findMany();
  }

  /**
   * Pobiera pracowników z danym stanowiskiem - approximation
   */
  async getByPositionId(positionId: string) {
    return await prisma.user.findMany();
  }

  /**
   * Pobiera wszystkich użytkowników
   */
  async findAll() {
    return await prisma.user.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Pobiera użytkownika po loginie
   */
  async findByLogin(login: string) {
    return await prisma.user.findUnique({
      where: { login }
    });
  }

  /**
   * Tworzy nowego użytkownika
   */
  async create(data: any) {
    return await prisma.user.create({
      data
    });
  }

  /**
   * Aktualizuje użytkownika
   */
  async update(id: string, data: any) {
    return await prisma.user.update({
      where: { id },
      data
    });
  }

  /**
   * Usuwa użytkownika
   */
  async delete(id: string) {
    return await prisma.user.delete({
      where: { id }
    });
  }
}


