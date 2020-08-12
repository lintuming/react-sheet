enum SheetTags {
  noop = /*                                    */ 0b000000000,
  mainButtonPressed = /*                       */ 0b000000001,
  queuedRender = /*                            */ 0b000000010,
  queuedComponentUpdate = /*                   */ 0b000000100,
}

export { SheetTags };
