import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toWords'
})
export class ToWordsPipe implements PipeTransform {

  transform(value: number, type:string): any {
    if(!type) {
      return value;
    }
    if(type === 'priority') {
      const priorities = ['undetermined', 'low', 'medium', 'high', 'urgent'];
      return priorities[value];
    }
  }

}
