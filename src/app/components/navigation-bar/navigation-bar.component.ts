import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../search-bar/search-bar.component';

@Component({
  selector: 'app-navigation-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchBarComponent],
  templateUrl: './navigation-bar.component.html',
  styleUrl: './navigation-bar.component.css',
})
export class NavigationBarComponent {
  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
