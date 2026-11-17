import Phaser from 'phaser';

export default class StreetScene extends Phaser.Scene {
  constructor() {
    super('Street');
  }

  create() {
    const { width, height } = this.scale;

    // Grassy ground strip along the bottom
    this.add.rectangle(0, height - 40, width, 40, 0x6b8f5e).setOrigin(0, 0);

    // Placeholder player (a pink box for now)
    const player = this.add.rectangle(width / 2, height - 56, 16, 32, 0xf2a7b8);

    // Title
    this.add
      .text(width / 2, 40, 'Paw Pal', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5);

    // Gentle bounce so you can tell the game is running
    this.tweens.add({ targets: player, y: player.y - 4, duration: 500, yoyo: true, repeat: -1 });
  }
}
