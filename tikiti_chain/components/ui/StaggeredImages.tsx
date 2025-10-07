import React from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function HorizontalStaggeredGallery() {
  const CONTAINER_HEIGHT = 240;
  const GAP = 8;

  const images = [
    { id: 1, uri: "https://picsum.photos/180/120", width: 120, height: 80 },
    { id: 2, uri: "https://picsum.photos/200/150", width: 140, height: 100 },
    { id: 3, uri: "https://picsum.photos/160/200", width: 100, height: 130 },
    { id: 4, uri: "https://picsum.photos/220/140", width: 150, height: 90 },
    { id: 5, uri: "https://picsum.photos/190/180", width: 130, height: 120 },
    { id: 6, uri: "https://picsum.photos/170/130", width: 110, height: 85 },
    { id: 7, uri: "https://picsum.photos/210/160", width: 140, height: 105 },
    { id: 8, uri: "https://picsum.photos/180/190", width: 120, height: 125 },
    { id: 9, uri: "https://picsum.photos/200/130", width: 135, height: 85 },
    { id: 10, uri: "https://picsum.photos/160/170", width: 105, height: 110 },
    { id: 11, uri: "https://picsum.photos/230/140", width: 155, height: 95 },
    { id: 12, uri: "https://picsum.photos/180/160", width: 120, height: 105 },
    { id: 13, uri: "https://picsum.photos/190/200", width: 125, height: 130 },
    { id: 14, uri: "https://picsum.photos/170/140", width: 115, height: 90 },
    { id: 15, uri: "https://picsum.photos/200/170", width: 135, height: 115 },
    { id: 16, uri: "https://picsum.photos/160/120", width: 110, height: 80 },
    { id: 17, uri: "https://picsum.photos/180/200", width: 120, height: 135 },
    { id: 18, uri: "https://picsum.photos/200/140", width: 140, height: 95 },
  ];

  // 👇 Packing logic: vertical stacking per column until height limit
  const packImagesIntoColumns = () => {
    const columns = [];
    let index = 0;

    while (index < images.length) {
      let currentColumn = [];
      let currentHeight = 0;
      let maxWidth = 0;

      while (index < images.length) {
        const image = images[index];
        const effectiveHeight =
          image.height + (currentColumn.length > 0 ? GAP : 0);

        if (
          currentHeight + effectiveHeight <= CONTAINER_HEIGHT ||
          currentColumn.length === 0
        ) {
          currentColumn.push(image);
          currentHeight += effectiveHeight;
          maxWidth = Math.max(maxWidth, image.width);
          index++;
        } else {
          // Try to find a smaller image that fits
          let foundFit = false;
          for (let i = index + 1; i < images.length; i++) {
            const testImage = images[i];
            const testEffectiveHeight =
              testImage.height + (currentColumn.length > 0 ? GAP : 0);
            if (currentHeight + testEffectiveHeight <= CONTAINER_HEIGHT) {
              // Swap
              [images[index], images[i]] = [images[i], images[index]];
              foundFit = true;
              break;
            }
          }

          if (!foundFit) break; // Start a new column
        }
      }

      columns.push(currentColumn);
    }

    return columns;
  };

  const columns = packImagesIntoColumns();

  const renderColumn = (imagesInColumn, columnIndex) => (
    <View
      key={columnIndex}
      style={[
        styles.column,
        {
          marginRight: GAP,
        },
      ]}
    >
      {imagesInColumn.map((image, index) => (
        <TouchableOpacity
          key={image.id}
          style={{
            width: image.width,
            height: image.height,
            marginBottom: index < imagesInColumn.length - 1 ? GAP : 0,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: "#fff",
            elevation: 2,
          }}
        >
          <Image
            source={{ uri: image.uri }}
            style={{
              width: image.width,
              height: image.height,
            }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { height: CONTAINER_HEIGHT }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {columns.map((col, i) => renderColumn(col, i))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
  },
  column: {
    flexDirection: "column",
    alignItems: "center",
  },
});
