import { Component, OnInit } from '@angular/core';
import { TestService } from '../test.service';

@Component({
  selector: 'app-ai-tests-list',
  templateUrl: './ai-tests-list.component.html',
  styleUrls: ['./ai-tests-list.component.scss']
})
export class AITestsListComponent implements OnInit {
  aiTests: any[] = [];

  constructor(private testService: TestService) { }

  ngOnInit(): void {
    this.loadAITests();
  }

  loadAITests(): void {
    this.testService.getAIGeneratedTests().subscribe(
      (tests) => {
        this.aiTests = tests;
      },
      (error) => {
        console.error('Error loading AI-generated tests:', error);
      }
    );
  }

  viewTest(id: string): void {
    // Implement view test functionality
    console.log('View test:', id);
  }

  editTest(id: string): void {
    // Implement edit test functionality
    console.log('Edit test:', id);
  }

  runTest(id: string): void {
    this.testService.runAIGeneratedTest(id).subscribe(
      (result) => {
        console.log('Test run result:', result);
        // Update the test status or display the result
      },
      (error) => {
        console.error('Error running test:', error);
      }
    );
  }
}