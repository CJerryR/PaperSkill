import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { DeskAnalogy } from './desk-analogy';
import { DeskKit } from './desk-kit';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { M1_1 } from './m1-1';
import { M10_1 } from './m10-1';
import { M10_2 } from './m10-2';
import { M2_1 } from './m2-1';
import { M3_1 } from './m3-1';
import { M4_1 } from './m4-1';
import { M5_1 } from './m5-1';
import { M6_1 } from './m6-1';
import { M7_1 } from './m7-1';
import { M7_2 } from './m7-2';
import { M8_1 } from './m8-1';
import { M9_1 } from './m9-1';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['desk-analogy'] = DeskAnalogy;
widgetRegistry['desk-kit'] = DeskKit;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['m1-1'] = M1_1;
widgetRegistry['m10-1'] = M10_1;
widgetRegistry['m10-2'] = M10_2;
widgetRegistry['m2-1'] = M2_1;
widgetRegistry['m3-1'] = M3_1;
widgetRegistry['m4-1'] = M4_1;
widgetRegistry['m5-1'] = M5_1;
widgetRegistry['m6-1'] = M6_1;
widgetRegistry['m7-1'] = M7_1;
widgetRegistry['m7-2'] = M7_2;
widgetRegistry['m8-1'] = M8_1;
widgetRegistry['m9-1'] = M9_1;
