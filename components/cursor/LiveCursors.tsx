import React from "react";
import {LiveCursorProps} from "@/types/type";
import Cursor from "@/components/cursor/Cursor";
import {COLORS} from "@/constants";

const LiveCursors= ({others}:LiveCursorProps) => {
 return  others.map(({connectionId,presence}) => {
      if(!presence?.cursor) return null;
      return (<Cursor
      key={connectionId}
      color={COLORS[Number(connectionId) % COLORS.length]}
      y = {presence.cursor.y}
      x = {presence.cursor.x}
      message={presence.message}

      />)
  })
}
export default LiveCursors;
