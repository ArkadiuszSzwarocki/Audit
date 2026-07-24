import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiResponse {
  static success<T>(data: T, statusCode: number = 200, message?: string) {
    return NextResponse.json(
      {
        success: true,
        data,
        ...(message ? { message } : {}),
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }

  static error(message: string, statusCode: number = 400, details: any = null) {
    return NextResponse.json(
      {
        success: false,
        error: message,
        ...(details ? { details } : {}),
        statusCode,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }

  static handleApiError(error: any, fallbackMessage: string = 'Wystąpił nieoczekiwany błąd serwera') {
    console.error('[API Error]:', error);

    if (error instanceof ZodError) {
      const firstIssue = error.issues[0]?.message;
      const formattedErrors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: firstIssue || 'Błąd walidacji danych wejściowych',
          details: formattedErrors,
          statusCode: 400,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (typeof error === 'string') {
      return this.error(error, 400);
    }

    const statusCode = typeof error?.status === 'number' ? error.status : (typeof error?.statusCode === 'number' ? error.statusCode : 500);
    const errorMessage = error?.message || fallbackMessage;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        statusCode,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}
