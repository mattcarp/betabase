import { Component } from '@angular/core';
import { TestService } from '../test.service';

@Component({
  selector: 'app-ai-test-generator',
  templateUrl: './ai-test-generator.component.html',
  styleUrls: ['./ai-test-generator.component.scss']
})
export class AITestGeneratorComponent {
  testType: 'unit' | 'e2e' = 'unit';
  functionCode: string = '';
  url: string = '';
  testDescription: string = '';

  constructor(private testService: TestService) {}

  generateTest(): void {
    const testData = {
      type: this.testType,
      functionCode: this.testType === 'unit' ? this.functionCode : undefined,
      url: this.testType === 'e2e' ? this.url : undefined,
      testDescription: this.testDescription
    };

    this.testService.createAIGeneratedTest(testData).subscribe(
      (result) => {
        console.log('AI-generated test created:', result);
        // Handle successful test generation (e.g., show success message, navigate to test list)
      },
      (error) => {
        console.error('Error generating AI test:', error);
        // Handle error (e.g., show error message)
      }
    );
  }
}