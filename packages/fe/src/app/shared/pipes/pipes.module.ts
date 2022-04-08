import { NgModule } from '@angular/core';

import { HighlightSearchPipe } from './highlight-search';

@NgModule({
  exports: [HighlightSearchPipe],
  declarations: [HighlightSearchPipe],
})
export class PipesModule {}
