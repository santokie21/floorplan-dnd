import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AnimationIcon from "@mui/icons-material/Animation";
import SensorDoorIcon from "@mui/icons-material/SensorDoor";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import { CastConnectedRounded } from "@mui/icons-material";

import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
} from "react-flow-renderer";

import { DndProvider, useDrag, useDrop, DragPreviewImage } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ListItemText, TextField } from "@mui/material";
import html2canvas from "html2canvas";

const drawerWidth = 240;

// Custom node component to render images
const ImageNode = ({ data }) => {
  const { src, width, height, onClick } = data;
  return (
    <div
      style={{ width: width, height: height }}
      onClick={onClick} // Ensure the onClick handler is applied here
    >
      <img src={src} alt="uploaded" style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

// Custom node component to render icons
const IconNode = ({ data }) => {
  const { icon: IconComponent, width, height, type, onClick } = data; // Include onClick in data
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      onClick={onClick} // Ensure the onClick handler is applied here
    >
      <IconComponent style={{ fontSize: "2rem" }} />
      <Typography variant="caption">{type}</Typography>
    </div>
  );
};

// Register the custom node types
const nodeTypes = {
  img: ImageNode,
  icon: IconNode,
};

const ItemTypes = {
  DEVICE: "device",
};

const DraggableListItem = ({ icon, type, isImageUploaded }) => {
  const dragRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const [{ isDragging }, drag, previewRef] = useDrag(
    () => ({
      type: ItemTypes.DEVICE,
      item: { type, icon }, // Include the type here
      canDrag: isImageUploaded,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [isImageUploaded]
  );

  useEffect(() => {
    if (isImageUploaded && dragRef.current) {
      html2canvas(dragRef.current, { backgroundColor: null }).then((canvas) => {
        setPreview(canvas.toDataURL());
      });
    }
  }, [icon, type, isImageUploaded]);

  return (
    <>
      {isImageUploaded && preview && (
        <DragPreviewImage connect={previewRef} src={preview} />
      )}
      <div ref={dragRef} style={{ display: "inline-block" }}>
        <ListItem disablePadding ref={drag}>
          <ListItemButton>
            <ListItemIcon>
              {React.createElement(icon, { fontSize: "inherit" })}
            </ListItemIcon>
            <ListItemText primary={type} />
          </ListItemButton>
        </ListItem>
      </div>
    </>
  );
};

const insertNode = (newNode, nodes) => {
  const imageNode = nodes.find((node) => node.type === "img");
  if (imageNode) {
    return [imageNode, ...nodes.filter((node) => node.type !== "img"), newNode];
  }
  return [...nodes, newNode];
};

// Popup component
const Popup = ({ content, onClose }) => {
  return (
    <div style={popupStyles.overlay}>
      <div style={popupStyles.popup}>
        <button onClick={onClose} style={popupStyles.closeButton}>X</button>
        <p>Enter the serial Number for {content}:</p>
        <TextField
          fullWidth
          name="serialNO"
          label="Serial No"
          autoComplete="off"
          placeholder="serial no."
          variant="outlined"
          style={{ marginBottom: '40px' }}
        />
        <Button
          variant="contained"
          color="success"
          type="submit"
          style={popupStyles.submitButton}
        >
          Update
        </Button>
        <Button
          variant="contained"
          color="error"
          type="submit"
          style={popupStyles.deleteButton}
        >
          Delete
        </Button>

      </div>
    </div>
  );
};

const popupStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000'
  },
  popup: {
    background: 'white',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    position: 'relative',
    width: "500px"
  },
  closeButton: {
    position: 'absolute',
    top: '8px',
    right: '10px',
    background: 'red',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    cursor: 'pointer',
  },
  submitButton: {
    position: 'absolute',
    bottom: '8px',
    right: '110px'
  },
  deleteButton: {
    position: 'absolute',
    bottom: '8px',
    right: '10px'
  }
};

function ResponsiveDrawer(props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [canvasHeight, setCanvasHeight] = useState(
    window ? window.innerHeight : "100vh"
  );
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupContent, setPopupContent] = useState('');
  const reactFlowInstance = useReactFlow();

  const reactFlowWrapper = useRef(null);

  // Counters for naming
  const [, setCounters] = useState({
    agent: 1,
    T: 1,
    D: 1,
    M: 1,
    W: 1
  });

  useEffect(() => {
    const handleResize = () => {
      setCanvasHeight(window ? window.innerHeight : "100vh");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [window, nodes]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };


  const handleImageUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const imageNode = {
            id: `image-${new Date().getTime()}`,
            type: "img",
            data: {
              src: reader.result,
              width: img.width,
              height: img.height,
            },
            position: {
              x: 100,
              y: 100,
            },
            draggable: false,
            selectable: false,
          };
          setNodes((nds) => insertNode(imageNode, nds));
          setIsImageUploaded(true); // Set image uploaded status to true
        };
        img.onerror = (error) => {
          console.error("Error loading image:", error);
        };
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (item, monitor) => {
    const offset = monitor.getClientOffset();

    if (offset && reactFlowWrapper.current) {
      const boundingRect = reactFlowWrapper.current.getBoundingClientRect();

      const reactFlowBounds = reactFlowInstance.project({
        x: offset.x - boundingRect.left - 180,
        y: offset.y - boundingRect.top + 100,
      });

      const getNodeName = (type) => {
        let name;
        setCounters((prev) => {
          const newCounters = { ...prev };

          if (type === "Water leak") {
            name = `Water_WL${newCounters.W}`;
            newCounters.W += 1;
          } else if (type === "Motion") {
            name = `Motion_M${newCounters.M}`;
            newCounters.M += 1;
          } else if (type === "Temp/Humidity") {
            name = `Temp_T${newCounters.T}`;
            newCounters.T += 1;
          } else if (type === "Door") {
            name = `Door_D${newCounters.D}`;
            newCounters.D += 1;
          } else {
            name = type;
          }
          return newCounters;
        });
        return name;
      };

      const newNode = {
        id: `device-${new Date().getTime()}`,
        type: "icon",
        data: {
          icon: item.icon,
          width: 60,
          height: 60,
          type: getNodeName(item.type), // Use the naming convention here
          onClick: () => handleNodeClick(getCurrentClickingNode(item.type)) // Add click handler
        },
        position: {
          x: reactFlowBounds.x,
          y: reactFlowBounds.y,
        },
        draggable: true,
      };

      setNodes((nds) => insertNode(newNode, nds));
    }
  };

  const getCurrentClickingNode = (type) => {
    let currentName;

    setCounters((prev) => {
      const newCounters = { ...prev };

      if (type === "Water leak") {
        newCounters.W -= 1;
        currentName = `Water_WL${newCounters.W}`;
        newCounters.W += 1;
      } else if (type === "Motion") {
        newCounters.M -= 1;
        currentName = `Motion_M${newCounters.M}`;
        newCounters.M += 1;
      } else if (type === "Temp/Humidity") {
        newCounters.T -= 1;
        currentName = `Temp_T${newCounters.T}`;
        newCounters.T += 1;
      } else if (type === "Door") {
        newCounters.D -= 1;
        currentName = `Door_D${newCounters.D}`;
        newCounters.D += 1;
      } else {
        currentName = type;
      }
      return newCounters;
    });
    return currentName
  }

  const handleNodeClick = (content) => {
    setPopupContent(content);
    setIsPopupVisible(true);
  };

  const handleNodeDragStop = (event, node) => {
    const imageNode = nodes.find((n) => n.type === "img");
    if (imageNode) {
      const { position, data } = imageNode;
      const { width, height } = data;
      const xWithinBounds =
        node.position.x >= position.x &&
        node.position.x + node.data.width <= position.x + width;
      const yWithinBounds =
        node.position.y >= position.y &&
        node.position.y + node.data.height <= position.y + height;

      if (!xWithinBounds || !yWithinBounds) {
        const newNodes = nodes.map((n) =>
          n.id === node.id
            ? {
              ...n,
              position: {
                x: Math.min(
                  Math.max(node.position.x, position.x),
                  position.x + width - node.data.width
                ),
                y: Math.min(
                  Math.max(node.position.y, position.y),
                  position.y + height - node.data.height
                ),
              },
            }
            : n
        );
        setNodes(newNodes);
      }
    }
  };

  const container =
    typeof window !== "undefined" ? () => document.body : undefined;

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <DraggableListItem
          icon={CastConnectedRounded}
          type={"OWM0131"}
          isImageUploaded={isImageUploaded}
        />
        <DraggableListItem
          icon={CastConnectedRounded}
          type={"FXA"}
          isImageUploaded={isImageUploaded}
        />
        <DraggableListItem
          icon={CastConnectedRounded}
          type={"OWM7111"}
          isImageUploaded={isImageUploaded}
        />
      </List>
      <Divider />
      <List>
        <DraggableListItem
          icon={WaterDropIcon}
          type={"Water leak"}
          isImageUploaded={isImageUploaded}
        />
        <DraggableListItem
          icon={AnimationIcon}
          type={"Motion"}
          isImageUploaded={isImageUploaded}
        />
        <DraggableListItem
          icon={SensorDoorIcon}
          type={"Door"}
          isImageUploaded={isImageUploaded}
        />
        <DraggableListItem
          icon={DeviceThermostatIcon}
          type={"Temp/Humidity"}
          isImageUploaded={isImageUploaded}
        />
      </List>
    </div>
  );

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.DEVICE,
    drop: (item, monitor) => handleDrop(item, monitor),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div>
              <Typography variant="h6" noWrap component="div">
                FloorPlan
              </Typography>
            </div>
            <div>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="upload-button"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="upload-button">
                <Button
                  variant="contained"
                  component="span"
                  style={{ marginLeft: "40px" }}
                >
                  Upload Image
                </Button>
              </label>
            </div>
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="devices-sensors"
      >
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <ReactFlowProvider>
          <div
            id="reactflow-wrapper"
            ref={
              isImageUploaded
                ? (el) => {
                  reactFlowWrapper.current = el;
                  drop(el);
                }
                : reactFlowWrapper
            }
            style={{
              height: canvasHeight,
              width: "100%",
              border: isOver ? "2px dashed green" : "none", // Highlight drop area when dragging over
            }}
          >
            <ReactFlow
              nodes={nodes}
              onNodesChange={onNodesChange}
              onNodeDragStop={handleNodeDragStop}
              nodeTypes={nodeTypes}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background variant="lines" gap={12} size={1} />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </Box>
      {isPopupVisible && <Popup content={popupContent} onClose={() => setIsPopupVisible(false)} />}
    </Box>
  );
}

ResponsiveDrawer.propTypes = {
  window: PropTypes.func,
};

export default function App(props) {
  return (
    <ReactFlowProvider>
      <DndProvider backend={HTML5Backend}>
        <ResponsiveDrawer {...props} />
      </DndProvider>
    </ReactFlowProvider>
  );
}
