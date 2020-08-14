const Noop = /*                                    */ 0b000000000;
const MainButtonPressed = /*                       */ 0b000000001;
const SerieBoxPressed = /*                         */ 0b000000011;

const markTag = (tag: number, tagToMarked: number) => {
  return tag | tagToMarked;
};

const clearTag = (tag: number, tagToCleared: number) => {
  return tag & ~tagToCleared;
};

const hasTag = (tag: number, tag1: number) => {
  return (tag & tag1) === tag1;
};
export { Noop, MainButtonPressed, SerieBoxPressed, markTag, clearTag, hasTag };
