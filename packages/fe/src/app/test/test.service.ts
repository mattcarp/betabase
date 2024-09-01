import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getTests(app: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tests/${app}`);
  }

  getTest(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/test/${id}`);
  }

  createTest(test: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/test`, test);
  }

  updateTest(id: string, test: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/test/${id}`, test);
  }

  deleteTest(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/test/${id}`);
  }

  // New methods for AI-generated tests
  getAIGeneratedTests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ai-tests`);
  }

  getAIGeneratedTest(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ai-tests/${id}`);
  }

  createAIGeneratedTest(testData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ai-tests/${testData.type}`, testData);
  }

  updateAIGeneratedTest(id: string, testData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/ai-tests/${id}`, testData);
  }

  runAIGeneratedTest(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ai-tests/${id}/run`, {});
  }
}