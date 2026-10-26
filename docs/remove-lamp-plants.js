// Original GLB vertex ranges: floor plant by the bed and plant beside the lamp.
// Preserve vertex numbering because the bedding is extracted from this mesh.
export function removeLampPlants(room) {
  const ranges = { room: [233498, 235833], lamp: [7416, 9751] };
  room.traverse(mesh => {
    const range = ranges[mesh.name];
    if (!mesh.isMesh || !range || !mesh.geometry.index) return;
    const index = mesh.geometry.index.array;
    const kept = [];
    for (let i = 0; i < index.length; i += 3) {
      if (index[i] >= range[0] && index[i] <= range[1]) continue;
      kept.push(index[i], index[i + 1], index[i + 2]);
    }
    mesh.geometry.setIndex(kept);
  });
}
