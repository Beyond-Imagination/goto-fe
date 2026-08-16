import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    flex: 1
  },
  mapIndoor: {
    backgroundColor: "#fbfbfa"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  errorText: {
    color: "#b91c1c",
    fontFamily: "monospace",
    fontSize: 12,
    textAlign: "center"
  },
  overlayCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)"
  },
  indoorHeader: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 6
  },
  navIconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
  },
  navTitle: {
    fontSize: 16.5,
    fontWeight: "700",
    color: "#111827"
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  placeRowText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1
  },
  placeRowChevron: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 2
  },
  mapArea: {
    flex: 1
  },
  floorSelector: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14
  },
  floorTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3
  },
  floorTabActive: {
    backgroundColor: "#166258"
  },
  floorTabText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "600"
  },
  floorTabTextActive: {
    color: "#ffffff"
  },
  nodeSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  nodeSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginBottom: 10
  },
  nodeSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  nodeSheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827"
  },
  nodeSheetCloseText: {
    fontSize: 16,
    color: "#6b7280",
    paddingHorizontal: 4
  },
  nodeStatusRow: {
    marginBottom: 14
  },
  nodeStatusChip: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 6
  },
  nodeStatusChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280"
  },
  nodeStatusMeta: {
    fontSize: 12,
    color: "#6b7280"
  },
  nodeActionRow: {
    flexDirection: "row",
    gap: 8
  },
  nodeActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f6f7f5",
    minHeight: 44
  },
  nodeActionButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#111827"
  },
  nodeLocNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb"
  },
  nodeLocNoteTextGroup: {
    flex: 1
  },
  nodeLocNoteTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
    marginBottom: 2
  },
  nodeLocNoteFloor: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#6b7280",
    lineHeight: 16
  },
  facilityDrawer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 16,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  facilityDrawerTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 10
  },
  facilityList: {
    paddingHorizontal: 16
  },
  facilityItem: {
    alignItems: "center",
    marginRight: 14,
    width: 56
  },
  facilityItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#166258",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  facilityItemEmoji: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff"
  },
  facilityItemLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "center"
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#ffffff"
  },
  emptyStateIllustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22
  },
  emptyStateIllustrationEmoji: {
    fontSize: 40
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8
  },
  emptyStateDescription: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 26
  },
  emptyPrimaryButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    marginBottom: 10
  },
  emptyPrimaryButtonText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700"
  },
  emptySecondaryButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#111827",
    alignItems: "center"
  },
  emptySecondaryButtonText: {
    color: "#111827",
    fontSize: 14.5,
    fontWeight: "700"
  },
  nodeMarker: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#166258",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3
  },
  nodeMarkerEmoji: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff"
  },
  roomLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center"
  },
  placeMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5
  },
  placeMarkerEmoji: {
    fontSize: 18
  },
  locationAccuracyBadgeWrap: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  locationAccuracyBadge: {
    backgroundColor: "rgba(17, 24, 39, 0.75)",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  locationAccuracyBadgeText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "600"
  }
});
